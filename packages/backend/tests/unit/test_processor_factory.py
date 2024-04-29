import unittest
from app.processors.factory.processor_factory_iter_modules import (
    ProcessorFactoryIterModules,
)
from app.processors.components.processor import BasicProcessor, ContextAwareProcessor


class DummyProcessor(BasicProcessor):
    processor_type = "dummy_processor"

    def process(self):
        pass

    def cancel(self):
        pass


class APIDummyProcessor(ContextAwareProcessor):
    processor_type = "api_dummy_processor"

    def __init__(self, config, context=None):
        super().__init__(config)
        self._processor_context = context

    def process(self):
        pass

    def cancel(self):
        pass


class TestProcessorFactory(unittest.TestCase):
    def setUp(self):
        self.factory = ProcessorFactoryIterModules()

    def test_register_and_create_simple_processor(self):
        self.factory.register_processor(DummyProcessor.processor_type, DummyProcessor)
        processor = self.factory.create_processor(
            {"processorType": "dummy_processor", "name": "dummy_processor"}
        )
        self.assertIsInstance(processor, DummyProcessor)
        self.assertIsInstance(processor, BasicProcessor)

    def test_create_unknown_processor_raises_exception(self):
        with self.assertRaises(ValueError):
            self.factory.create_processor(
                {"processorType": "unknown_processor", "name": "unknown_processor"}
            )

    def test_create_processor_with_api_context_data(self):
        self.factory.register_processor(
            APIDummyProcessor.processor_type, APIDummyProcessor
        )
        processor = self.factory.create_processor(
            {"processorType": "api_dummy_processor", "name": "api_dummy_processor"},
            context_data="api_data",
        )
        self.assertIsInstance(processor, APIDummyProcessor)
        self.assertIsInstance(processor, ContextAwareProcessor)
        self.assertEqual(processor._processor_context, "api_data")
