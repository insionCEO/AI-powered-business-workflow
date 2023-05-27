from .processor import Processor

import openai

class DallEPromptProcessor(Processor):
    processor_type = "dalle-prompt"
    
    def __init__(self, config):
        super().__init__(config)
        self.prompt = config.get("prompt")
        self.size = config.get("size", "256x256")  # Default size is "256x256"

    def process(self):
        self.prompt = self.input_processor.get_output(self.input_key) if self.prompt is None or len(self.prompt) == 0 else self.prompt
        response = openai.Image.create(
            prompt=self.prompt,
            n=1,
            size=self.size,
        )
        self.set_output(response["data"][0]["url"])
        
        return self._output

    def updateContext(self, data):
        pass
