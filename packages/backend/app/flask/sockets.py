from app.flask.app import app
import logging
import json
import eventlet
from flask import g
from flask_socketio import SocketIO, emit
from ..processors_utils.processor_launcher import (
    load_processors,
    launchProcessors,
    launch_processors_for_node,
    load_processors_for_node,
)
import traceback
import os
from .decorators import with_flow_data_validations
from .validators import max_empty_output_data, max_url_input_nodes, max_nodes

eventlet.monkey_patch(all=False, socket=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")


def populate_session_global_object(data):
    """
    This function is responsible for initializing global session objects either from the
    environmental variables or from the data passed as arguments, ensuring that the necessary API
    keys are available throughout the session for different processes.

    Parameters:
        data (dict): A dictionary containing potentially necessary keys: "openai_api_key" and "stabilityai_api_key".
    """
    use_env = os.getenv("USE_ENV_API_KEYS")
    logging.debug("use_env: %s", use_env)
    if use_env == "true":
        g.session_openai_api_key = os.getenv("OPENAI_API_KEY")
        g.session_stabilityai_api_key = os.getenv("STABILITYAI_API_KEY")
    else:
        if "openaiApiKey" in data:
            g.session_openai_api_key = data["openaiApiKey"]
        else:
            raise Exception("No OpenAI API Key provided.")
        if "stabilityaiApiKey" in data:
            g.session_stabilityai_api_key = data["stabilityaiApiKey"]


@socketio.on("connect")
def handle_connect():
    logging.info("Client connected")


@socketio.on("process_file")
@with_flow_data_validations(max_nodes, max_url_input_nodes)
def handle_process_file(data):
    """
    This event handler is activated when a "process_file" event is received via Socket.IO. It allows to run every node in
    the file, even if they have been executed before.

    Parameters:
        data (dict): A dictionary encompassing the event's payload, which comprises the JSON configuration file
                    ("jsonFile").

    """
    try:
        logging.debug("Received process_config event with data: %s", data)
        populate_session_global_object(data)
        flow_data = json.loads(data.get("jsonFile"))

        if flow_data:
            processors = load_processors(flow_data)
            output = launchProcessors(processors, ws=True)

            logging.debug("Emitting processing_result event with output: %s", output)
            emit("run_end", {"output": output})
        else:
            logging.warning("Invalid input or missing configuration file")
            emit("error", {"error": "Invalid input or missing configuration file"})
    except Exception as e:
        emit("error", {"error": str(e)})
        # traceback.print_exc()
        logging.error(f"An error occurred: {str(e)}")


@socketio.on("run_node")
@with_flow_data_validations(max_empty_output_data, max_url_input_nodes)
def handle_run_node(data):
    """
    This event handler is activated when a "run_node" event is received via Socket.IO. It facilitates the processing
    of the specified node in the data payload, launching only the designated node and preceding nodes if they
    haven't been executed earlier.

    Parameters:
        data (dict): A dictionary encompassing the event's payload, which comprises the JSON configuration file
                    ("jsonFile") and the name of the node to run ("nodeName").

    """
    try:
        logging.debug("Received run_node event with data: %s", data)
        populate_session_global_object(data)
        flow_data = json.loads(data.get("jsonFile"))
        node_name = data.get("nodeName")

        if flow_data and node_name:
            processors = load_processors_for_node(flow_data, node_name)
            output = launch_processors_for_node(processors, node_name, ws=True)
            logging.debug("Emitting processing_result event with output: %s", output)
            emit("run_end", {"output": output})
        else:
            logging.warning("Invalid input or missing parameters")
            emit("error", {"error": "Invalid input or missing parameters"})
    except Exception as e:
        emit(
            "error",
            {"error": str({node_name}) + " - " + str(e), "node_name": node_name},
        )
        logging.error(f"An error occurred: {node_name} - {str(e)}")


@socketio.on("disconnect")
def handle_disconnect():
    logging.info("Client disconnected")
