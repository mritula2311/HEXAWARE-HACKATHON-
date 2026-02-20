#!/usr/bin/env python3
"""
Quiz Evaluator Configuration Manager
Demonstrates how to use the updatable QuizEvaluatorAgent
"""

from app.agents.quiz_evaluator_agent import QuizEvaluatorAgent

def demo_updatable_quiz_evaluator():
    """Demonstrate configurable quiz evaluation features"""
    
    # Initialize with custom configuration
    custom_config = {
        "daily_question_count": 8,  # More questions per day
        "default_passing_score": 80,  # Higher passing threshold
        "competency_thresholds": {
            "exceeds": 95,
            "meets": 80,
            "developing": 60,
            "needs_improvement": 0
        }
    }
    
    evaluator = QuizEvaluatorAgent(config=custom_config)
    
    # Update feedback templates for different audiences
    corporate_templates = {
        "exceeds": "Exceptional technical proficiency demonstrated. Candidate exceeds industry standards and shows leadership potential.",
        "meets": "Strong technical foundation with good problem-solving skills. Ready for independent work assignments.",
        "developing": "Shows promise but requires mentorship. Technical concepts understood but application needs strengthening.",
        "needs_improvement": "Foundational gaps identified. Recommend structured learning path before role assignment."
    }
    
    evaluator.update_feedback_templates(corporate_templates)
    
    # Update scoring thresholds for different difficulty levels
    evaluator.update_competency_thresholds({
        "exceeds": 92,
        "meets": 75,
        "developing": 55
    })
    
    # Custom LLM prompt for specialized domains
    custom_prompt = """You are a Senior Technical Interviewer evaluating a coding assessment.
    
Assessment: {assessment_title}
Performance: {score:.1f}% (Target: {passing_score}%)
Questions: {total_questions - incorrect_count}/{total_questions} correct

FOCUS AREAS:
- Code quality and best practices
- Problem-solving approach
- Technical depth and understanding
- Industry readiness

Provide evaluation as JSON with professional technical feedback."""
    
    evaluator.update_llm_prompt_template(custom_prompt)
    
    # Get current configuration
    current_config = evaluator.get_config()
    stats = evaluator.get_evaluation_stats()
    
    print("=== QUIZ EVALUATOR CONFIGURATION ===")
    print(f"Daily Questions: {current_config['daily_question_count']}")
    print(f"Passing Score: {current_config['default_passing_score']}%")
    print(f"Competency Levels: {current_config['competency_thresholds']}")
    print(f"Features: {', '.join(stats['features'])}")
    
    return evaluator

def create_domain_specific_evaluator(domain: str):
    """Create evaluator optimized for specific domains"""
    
    domain_configs = {
        "python_basics": {
            "daily_question_count": 5,
            "default_passing_score": 70,
            "competency_thresholds": {"exceeds": 90, "meets": 70, "developing": 50}
        },
        "advanced_algorithms": {
            "daily_question_count": 3,
            "default_passing_score": 85,
            "competency_thresholds": {"exceeds": 95, "meets": 85, "developing": 70}
        },
        "system_design": {
            "daily_question_count": 2,
            "default_passing_score": 75,
            "competency_thresholds": {"exceeds": 92, "meets": 75, "developing": 60}
        }
    }
    
    config = domain_configs.get(domain, domain_configs["python_basics"])
    return QuizEvaluatorAgent(config=config)

def runtime_config_update_example():
    """Show how to update configuration at runtime"""
    
    evaluator = QuizEvaluatorAgent()
    
    # During assessment, adjust difficulty
    if "morning_session":
        evaluator.update_config({
            "daily_question_count": 7,
            "default_passing_score": 75
        })
    
    # For different user groups
    if "senior_developers":
        evaluator.update_competency_thresholds({
            "exceeds": 95,
            "meets": 85,
            "developing": 70
        })
    
    # Update based on performance trends
    if "low_average_scores":
        evaluator.update_config({
            "default_passing_score": 65,
            "enable_llm_feedback": True,
            "fallback_on_llm_error": True
        })
    
    return evaluator

if __name__ == "__main__":
    print("Testing Updatable Quiz Evaluator...")
    
    # Demo 1: Custom configuration
    evaluator1 = demo_updatable_quiz_evaluator()
    
    print("\n=== DOMAIN-SPECIFIC EVALUATORS ===")
    
    # Demo 2: Domain-specific evaluators
    python_evaluator = create_domain_specific_evaluator("python_basics")
    print(f"Python Basics: {python_evaluator.get_config()['default_passing_score']}% passing")
    
    algo_evaluator = create_domain_specific_evaluator("advanced_algorithms")
    print(f"Algorithms: {algo_evaluator.get_config()['default_passing_score']}% passing")
    
    # Demo 3: Runtime updates
    runtime_evaluator = runtime_config_update_example()
    print(f"Runtime Config: {runtime_evaluator.get_config()['daily_question_count']} questions")
    
    print("\n✅ All evaluator configurations ready for use!")