from abc import ABC, abstractmethod
from app.core.llm_client import llm_client


class BaseAgent(ABC):
    """Base class for all MaverickAI agents."""

    def __init__(self, model_name: str = None):
        self.llm = llm_client
        self.model_name = model_name

    def call_llm(self, prompt: str, system: str = None) -> str:
        return self.llm.generate(
            prompt=prompt,
            model=self.model_name,
            system=system,
        )

    @abstractmethod
    def execute(self, db, *args, **kwargs):
        pass
