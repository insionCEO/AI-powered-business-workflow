from typing import List
from injector import Injector, Binder, Module
from .authentication.authenticator import Authenticator
from .authentication.cognito_authenticator import CognitoAuthenticator
from tests.utils.processor_factory_mock import ProcessorFactoryMock
from tests.utils.aunthenticator_mock import AuthenticatorMock
from .processors.launcher.async_leaf_processor_launcher import AsyncLeafProcessorLauncher
from .processors.launcher.async_processor_launcher import AsyncProcessorLauncher

from .llms.factory.llm_factory import LLMFactory
from .llms.factory.paid_api_llm_factory import PaidAPILLMFactory
from .processors.observer.socketio_event_emitter import SocketIOEventEmitter
from .processors.observer.observer import Observer
from .storage.local_storage_strategy import LocalStorageStrategy
from .storage.s3_storage_strategy import S3StorageStrategy
from .storage.storage_strategy import StorageStrategy
from .env_config import is_cloud_env, is_mock_env
from .processors.factory.processor_factory import ProcessorFactory
from .processors.factory.processor_factory_iter_modules import (
    ProcessorFactoryIterModules,
)
from .processors.launcher.processor_launcher import ProcessorLauncher

class AuthenticatorModule(Module):
    def configure(self, binder: Binder):
        if is_mock_env() : 
            binder.bind(Authenticator, to=AuthenticatorMock)
        else : 
            binder.bind(Authenticator, to=CognitoAuthenticator)

class ProcessorFactoryModule(Module):
    def configure(self, binder: Binder):
        if is_mock_env() : 
            fake_factory = ProcessorFactoryMock(with_delay=True)
            binder.bind(ProcessorFactory, to=fake_factory)
        else : 
            binder.bind(ProcessorFactory, to=ProcessorFactoryIterModules)


class StorageModule(Module):
    def configure(self, binder: Binder):
        if is_cloud_env():
            binder.bind(StorageStrategy, to=S3StorageStrategy)
        else:
            binder.bind(StorageStrategy, to=LocalStorageStrategy)


class ProcessorLauncherModule(Module):
    def configure(self, binder: Binder):
        binder.bind(ProcessorLauncher, to=AsyncProcessorLauncher)
        observer_list = [SocketIOEventEmitter()]
        if is_cloud_env():
            from .processors.observer.simple_stats_logger import SimpleStatsLogger
            
            observer_list.append(SimpleStatsLogger())
            
        binder.multibind(List[Observer], to=observer_list)


class LLMFactoryModule(Module):
    def configure(self, binder: Binder):
         binder.bind(LLMFactory, to=PaidAPILLMFactory)
         
def create_application_injector() -> Injector:
    injector = Injector(
        [AuthenticatorModule(), ProcessorFactoryModule(), StorageModule(), ProcessorLauncherModule(), LLMFactoryModule()],
        auto_bind=True,
    )
    return injector


root_injector: Injector = create_application_injector()
