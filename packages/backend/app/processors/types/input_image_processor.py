from .processor import SimpleProcessor


class InputImageProcessor(SimpleProcessor):
    processor_type = "input-image"

    def __init__(self, config):
        super().__init__(config)
        self.inputText = config["inputText"]

    def updateContext(self, data):
        pass

    def process(self):
        self.set_output(self.inputText)
        return self.inputText
