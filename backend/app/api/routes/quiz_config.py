"""
Quiz Evaluator Configuration API Routes
Provides endpoints to update quiz evaluation parameters
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.api.deps import get_current_user as get_current_active_user
from app.models.user import User
from app.agents.quiz_evaluator_agent import QuizEvaluatorAgent

router = APIRouter()

# Global evaluator instance (in production, use dependency injection)
evaluator_instance = QuizEvaluatorAgent()

# Pydantic models for API requests
class CompetencyThresholds(BaseModel):
    exceeds: Optional[float] = Field(None, ge=0, le=100)
    meets: Optional[float] = Field(None, ge=0, le=100)
    developing: Optional[float] = Field(None, ge=0, le=100)
    needs_improvement: Optional[float] = Field(None, ge=0, le=100)

class FeedbackTemplates(BaseModel):
    exceeds: Optional[str] = Field(None, max_length=500)
    meets: Optional[str] = Field(None, max_length=500)
    developing: Optional[str] = Field(None, max_length=500)
    needs_improvement: Optional[str] = Field(None, max_length=500)

class QuizEvaluatorConfig(BaseModel):
    daily_question_count: Optional[int] = Field(None, ge=1, le=20)
    default_question_points: Optional[int] = Field(None, ge=1, le=100)
    default_passing_score: Optional[float] = Field(None, ge=0, le=100)
    max_incorrect_details: Optional[int] = Field(None, ge=1, le=10)
    max_feedback_errors: Optional[int] = Field(None, ge=1, le=10)
    enable_llm_feedback: Optional[bool] = None
    fallback_on_llm_error: Optional[bool] = None

class LLMPromptTemplate(BaseModel):
    prompt_template: str = Field(..., min_length=50, max_length=2000)

@router.get("/config", response_model=Dict[str, Any])
async def get_evaluator_config(
    current_user: User = Depends(get_current_active_user)
):
    """Get current quiz evaluator configuration"""
    return {
        "config": evaluator_instance.get_config(),
        "stats": evaluator_instance.get_evaluation_stats()
    }

@router.put("/config")
async def update_evaluator_config(
    config: QuizEvaluatorConfig,
    current_user: User = Depends(get_current_active_user)
):
    """Update quiz evaluator configuration"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update evaluator configuration"
        )
    
    # Convert to dict and remove None values
    config_dict = {k: v for k, v in config.dict().items() if v is not None}
    
    if config_dict:
        evaluator_instance.update_config(config_dict)
        
    return {
        "message": f"Configuration updated successfully",
        "updated_fields": list(config_dict.keys()),
        "new_config": evaluator_instance.get_config()
    }

@router.put("/competency-thresholds")
async def update_competency_thresholds(
    thresholds: CompetencyThresholds,
    current_user: User = Depends(get_current_active_user)
):
    """Update competency level scoring thresholds"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update competency thresholds"
        )
    
    # Convert to dict and remove None values
    threshold_dict = {k: v for k, v in thresholds.dict().items() if v is not None}
    
    if threshold_dict:
        evaluator_instance.update_competency_thresholds(threshold_dict)
    
    return {
        "message": "Competency thresholds updated successfully",
        "updated_thresholds": threshold_dict,
        "current_thresholds": evaluator_instance.get_config()["competency_thresholds"]
    }

@router.put("/feedback-templates")
async def update_feedback_templates(
    templates: FeedbackTemplates,
    current_user: User = Depends(get_current_active_user)
):
    """Update feedback message templates"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update feedback templates"
        )
    
    # Convert to dict and remove None values
    template_dict = {k: v for k, v in templates.dict().items() if v is not None}
    
    if template_dict:
        evaluator_instance.update_feedback_templates(template_dict)
    
    return {
        "message": "Feedback templates updated successfully",
        "updated_templates": list(template_dict.keys()),
        "current_templates": evaluator_instance.get_config()["feedback_templates"]
    }

@router.put("/llm-prompt")
async def update_llm_prompt_template(
    prompt_data: LLMPromptTemplate,
    current_user: User = Depends(get_current_active_user)
):
    """Update LLM prompt template for generating feedback"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update LLM prompt template"
        )
    
    evaluator_instance.update_llm_prompt_template(prompt_data.prompt_template)
    
    return {
        "message": "LLM prompt template updated successfully",
        "template_length": len(prompt_data.prompt_template)
    }

@router.post("/presets/{preset_name}")
async def apply_configuration_preset(
    preset_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Apply a predefined configuration preset"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can apply configuration presets"
        )
    
    presets = {
        "beginner": {
            "daily_question_count": 3,
            "default_passing_score": 60,
            "competency_thresholds": {"exceeds": 85, "meets": 60, "developing": 40},
            "enable_llm_feedback": True
        },
        "intermediate": {
            "daily_question_count": 5,
            "default_passing_score": 70,
            "competency_thresholds": {"exceeds": 90, "meets": 70, "developing": 50},
            "enable_llm_feedback": True
        },
        "advanced": {
            "daily_question_count": 7,
            "default_passing_score": 80,
            "competency_thresholds": {"exceeds": 95, "meets": 80, "developing": 65},
            "enable_llm_feedback": True
        },
        "expert": {
            "daily_question_count": 10,
            "default_passing_score": 85,
            "competency_thresholds": {"exceeds": 97, "meets": 85, "developing": 70},
            "enable_llm_feedback": True
        }
    }
    
    if preset_name not in presets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset '{preset_name}' not found. Available presets: {list(presets.keys())}"
        )
    
    preset_config = presets[preset_name]
    
    # Apply configuration
    evaluator_instance.update_config(preset_config)
    
    # Apply competency thresholds if present
    if "competency_thresholds" in preset_config:
        evaluator_instance.update_competency_thresholds(preset_config["competency_thresholds"])
    
    return {
        "message": f"Applied '{preset_name}' preset successfully",
        "preset_config": preset_config,
        "current_config": evaluator_instance.get_config()
    }

@router.get("/presets")
async def get_available_presets(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available configuration presets"""
    presets = {
        "beginner": "Easy questions, lower passing scores, more supportive feedback",
        "intermediate": "Standard difficulty, balanced evaluation criteria",
        "advanced": "Challenging questions, higher standards, detailed feedback",
        "expert": "Maximum difficulty, professional-level evaluation"
    }
    
    return {
        "available_presets": presets,
        "current_config": evaluator_instance.get_config()
    }

@router.post("/reset")
async def reset_to_default_config(
    current_user: User = Depends(get_current_active_user)
):
    """Reset evaluator to default configuration"""
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reset configuration"
        )
    
    # Create new instance with default config
    global evaluator_instance
    evaluator_instance = QuizEvaluatorAgent()
    
    return {
        "message": "Configuration reset to default successfully",
        "default_config": evaluator_instance.get_config()
    }