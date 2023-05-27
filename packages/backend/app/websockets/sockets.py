import logging
import json
from flask import Flask
from flask import request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from ..processors_utils.processor_launcher import load_processors,load_processors_for_node, launchProcessors, launch_processors_for_node
from ..processors_utils.processor_store import ProcessorStoreFactory
import traceback

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

factory = ProcessorStoreFactory('local')
store = factory.create_store()

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected')

@socketio.on('process_file')
def handle_process_file(data):
    try:
        logging.info("Received process_config event with data: %s", data)
        flow_data = json.loads(data.get('json_file'))

        if flow_data:
            processors = load_processors(flow_data)
            output = launchProcessors(processors, ws=True)
            
            session_id = request.sid
            store.set(session_id, processors)

            logging.info("Emitting processing_result event with output: %s", output)
            emit('run_end', {'output': output})
        else:
            logging.warning("Invalid input or missing configuration file")
            emit('error', {'error': 'Invalid input or missing configuration file'})
    except Exception as e:
        emit('error', {'error': str(e)})
        traceback.print_exc()
        logging.error(f"An error occurred: {str(e)}")

@socketio.on('run_node')
def handle_process_file(data):
    try:
        logging.info("Received run_node event with data: %s", data)
        flow_data = json.loads(data.get('json_file'))
        node_name = data.get('node_name')
        stored_processors = store.get(request.sid)

        if flow_data and node_name:
            processors = load_processors_for_node(flow_data, stored_processors, node_name)
            output = launch_processors_for_node(processors, node_name, ws=True)
            session_id = request.sid
            store.set(session_id, processors)
            logging.info("Emitting processing_result event with output: %s", output)
            emit('run_end', {'output': output})
        else:
            logging.warning("Invalid input or missing parameters")
            emit('error', {'error': 'Invalid input or missing parameters'})
    except Exception as e:
        store.set(session_id, processors)
        emit('error', {'error': {node_name} - str(e)})
        logging.error(f"An error occurred: {node_name} - {str(e)}")

@socketio.on('disconnect')
def handle_disconnect():
    logging.info('Client disconnected')
