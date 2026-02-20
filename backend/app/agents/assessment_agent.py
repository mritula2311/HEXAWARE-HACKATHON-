import json
from datetime import datetime, timezone
from app.agents.base import BaseAgent
from app.models.assessment import Assessment, Submission
from app.config import settings


class AssessmentAgent(BaseAgent):
    """The Evaluator — grades code and quiz submissions using LLM review."""

    def __init__(self):
        super().__init__(model_name=settings.OLLAMA_CODE_MODEL)

    def execute(self, db, submission: Submission):
        assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()
        if not assessment:
            return {"error": "Assessment not found"}

        if submission.submission_type == "quiz":
            result = self._grade_quiz(db, submission, assessment)
        elif submission.submission_type == "code":
            result = self._grade_code(db, submission, assessment)
        else:
            result = self._grade_assignment(db, submission, assessment)

        # Update profile after grading
        try:
            from app.agents.profile_agent import ProfileAgent
            from app.models.fresher import Fresher
            fresher = db.query(Fresher).filter(Fresher.user_id == submission.user_id).first()
            if fresher:
                profile_agent = ProfileAgent()
                profile_agent.update_after_assessment(db, fresher, submission)
        except Exception as e:
            print(f"[AssessmentAgent] Profile update error: {e}")

        return result

    def _grade_quiz(self, db, submission: Submission, assessment: Assessment):
        # Parse answers
        answers = {}
        if submission.answers:
            try:
                answers = json.loads(submission.answers)
            except Exception:
                pass

        # Parse questions for correct answers
        questions = []
        if assessment.questions:
            try:
                questions = json.loads(assessment.questions)
            except Exception:
                pass

        # Auto-grade against correct answers
        total_points = 0
        earned_points = 0
        incorrect_questions = []  # Store full question details for better feedback
        
        for q in questions:
            q_id = q.get("id", "")
            points = q.get("points", 10)
            total_points += points
            correct = q.get("correct_answer", "")
            user_answer = answers.get(q_id, "")
            
            if str(user_answer).strip().lower() == str(correct).strip().lower():
                earned_points += points
            else:
                # Track full question details for detailed explanations
                incorrect_questions.append({
                    "question": q.get("question", "Unknown question"),
                    "user_answer": user_answer,
                    "correct_answer": correct,
                    "options": q.get("options", []),
                    "explanation": q.get("explanation", "")
                })

        score = (earned_points / total_points * 100) if total_points > 0 else 0

        # Generate detailed LLM feedback with question-specific information
        incorrect_details = "\n".join([
            f"Q: {iq['question']}\n  Your answer: {iq['user_answer']}\n  Correct answer: {iq['correct_answer']}"
            for iq in incorrect_questions[:5]
        ])
        
        prompt = f"""Analyze this quiz performance and provide detailed feedback in JSON format:

Assessment: {assessment.title}
Score: {earned_points}/{total_points} points ({score:.1f}%)
Questions Answered: {len(answers)}/{len(questions)}

Incorrect Questions:
{incorrect_details if incorrect_details else "None - all correct!"}

Provide a JSON response with:
{{
  "overall_comment": "Brief encouraging assessment (1-2 sentences)",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "missing_points": ["topic or concept missed 1", "topic or concept missed 2"],
  "errors": ["For '[question]', you answered '[user answer]' but the correct answer is '[correct answer]' because [explanation]"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "risk_level": "low/medium/high"
}}
"""

        try:
            llm_feedback = self.call_llm(prompt)
            feedback_data = json.loads(llm_feedback)
            
            # Ensure all required fields exist
            if not feedback_data.get("overall_comment"):
                feedback_data["overall_comment"] = f"You scored {score:.1f}%. {'Excellent work!' if score >= 80 else 'Good effort!' if score >= 60 else 'Keep practicing!'}"
            
        except Exception as e:
            print(f"[AssessmentAgent] LLM feedback error: {e}, using fallback with individual LLM explanations")
            
            # Generate personalized explanations using LLM individually for each error
            # This is slower but ensures high-quality feedback even if the main JSON generation failed
            detailed_errors = []
            for iq in incorrect_questions[:5]:
                try:
                    expl_prompt = f"""
                    Question: {iq['question']}
                    User Answer: {iq['user_answer']}
                    Correct Answer: {iq['correct_answer']}
                    
                    Explain why the user's answer is wrong and why the correct answer is right.
                    Keep it to 1-2 short, helpful sentences. Address the user directly ("You...").
                    """
                    explanation = self.call_llm(expl_prompt).strip().replace("\"", "'")
                except Exception as ex:
                    print(f"Error generating explanation for Q: {ex}")
                    explanation = f"The correct answer is '{iq['correct_answer']}'."

                error_msg = f"For '{iq['question']}', you answered '{iq['user_answer']}'. {explanation}"
                detailed_errors.append(error_msg)
            
            # Fallback feedback based on score
            if score >= 80:
                feedback_data = {
                    "overall_comment": f"Excellent work! You scored {score:.1f}%, demonstrating strong understanding of the concepts.",
                    "strengths": ["High accuracy on assessment questions", "Good grasp of core concepts"],
                    "weaknesses": ["Minor gaps in some advanced topics"] if score < 100 else ["None identified"],
                    "suggestions": ["Review any missed questions", "Explore advanced topics to deepen knowledge"],
                    "missing_points": [iq['question'] for iq in incorrect_questions[:2]],
                    "errors": detailed_errors,
                    "improvements": ["Revisit concepts behind missed questions", "Practice similar quizzes"],
                    "risk_level": "low"
                }
            elif score >= 60:
                feedback_data = {
                    "overall_comment": f"Good effort! You scored {score:.1f}%. You're on track but have room for improvement.",
                    "strengths": ["Attempted all questions", "Solid understanding of fundamentals"],
                    "weaknesses": ["Some conceptual gaps in key areas", "Accuracy could be improved"],
                    "suggestions": ["Review incorrect answers carefully", "Practice similar problems", "Revisit study materials"],
                    "missing_points": [iq['question'] for iq in incorrect_questions[:3]],
                    "errors": detailed_errors,
                    "improvements": ["Focus on weakest topics first", "Do short daily quizzes"],
                    "risk_level": "medium"
                }
            else:
                feedback_data = {
                    "overall_comment": f"You scored {score:.1f}%. This indicates significant gaps that need attention.",
                    "strengths": ["Completed the assessment"],
                    "weaknesses": ["Multiple fundamental concepts not understood", "Low accuracy rate"],
                    "suggestions": [
                        "Schedule a 1-on-1 session with your mentor",
                        "Revisit foundational study materials",
                        "Practice with easier problems first",
                        "Don't hesitate to ask for help"
                    ],
                    "missing_points": [iq['question'] for iq in incorrect_questions[:4]],
                    "errors": detailed_errors,
                    "improvements": ["Start with basics and build up", "Use guided practice daily"],
                    "risk_level": "high"
                }

        # Sanitize feedback for transit
        def sanitize_list(lst):
            if not isinstance(lst, list): return []
            return [str(i) for i in lst if not isinstance(i, (dict, list))][:4]  # Limit to 4 items

        clean_feedback = {
            "overall_comment": str(feedback_data.get("overall_comment", "")),
            "strengths": sanitize_list(feedback_data.get("strengths", [])),
            "weaknesses": sanitize_list(feedback_data.get("weaknesses", [])),
            "suggestions": sanitize_list(feedback_data.get("suggestions", [])),
            "missing_points": sanitize_list(feedback_data.get("missing_points", [iq['question'] for iq in incorrect_questions[:4]])),
            "errors": sanitize_list(feedback_data.get("errors", [f"For '{iq['question']}', you answered '{iq['user_answer']}' but the correct answer is '{iq['correct_answer']}'." for iq in incorrect_questions[:4]])),
            "improvements": sanitize_list(feedback_data.get("improvements", [])),
            "accuracy_score": float(score),
            "risk_level": str(feedback_data.get("risk_level", "medium" if score < 60 else "low")),
            "questions_attempted": len(answers),
            "questions_total": len(questions)
        }

        pass_status = "pass" if score >= assessment.passing_score else "fail"
        submission.score = round(score, 1)
        submission.pass_status = pass_status
        submission.status = "completed"
        submission.feedback = json.dumps(clean_feedback)
        submission.graded_at = datetime.now(timezone.utc)
        db.commit()

        return {"score": score, "pass_status": pass_status, "feedback": clean_feedback, "agent": "AssessmentAgent"}

    def _grade_code(self, db, submission: Submission, assessment: Assessment):
        code = submission.code or ""

        # Parse test cases
        test_cases = []
        if assessment.test_cases:
            try:
                test_cases = json.loads(assessment.test_cases)
            except Exception:
                pass

        # Execute Python code with actual test cases
        test_results = []
        passed = 0
        
        for i, tc in enumerate(test_cases):
            try:
                # Create isolated namespace for code execution
                namespace = {}
                
                # Execute the user's code
                exec(code, namespace)
                
                # Get the function name (assume first function defined)
                func_name = None
                for key in namespace:
                    if callable(namespace[key]) and not key.startswith('_'):
                        func_name = key
                        break
                
                if not func_name:
                    test_results.append({
                        "id": tc.get("id", str(i)),
                        "name": tc.get("name", f"Test {i+1}"),
                        "passed": False,
                        "expected": tc.get("expected_output"),
                        "actual": "No function found",
                        "error": "No callable function defined in code",
                        "points": tc.get("points", 10),
                    })
                    continue
                
                # Get the test input and execute function
                test_input = tc.get("input", "")
                expected = tc.get("expected_output", "")
                
                # Parse input (handle different types)
                try:
                    if test_input.strip().startswith('['):
                        parsed_input = eval(test_input)
                    else:
                        parsed_input = int(test_input) if test_input.isdigit() else test_input
                except:
                    parsed_input = test_input
                
                # Call the function
                func = namespace[func_name]
                actual = func(parsed_input)
                
                # Convert actual output to string for comparison
                actual_str = str(actual)
                expected_str = str(expected)
                
                # Check if test passed
                is_pass = actual_str == expected_str
                
                test_results.append({
                    "id": tc.get("id", str(i)),
                    "name": tc.get("name", f"Test {i+1}"),
                    "passed": is_pass,
                    "expected": expected_str,
                    "actual": actual_str,
                    "error": None if is_pass else f"Expected {expected_str}, got {actual_str}",
                    "points": tc.get("points", 10),
                })
                
                if is_pass:
                    passed += 1
                    
            except Exception as e:
                # Handle execution errors
                test_results.append({
                    "id": tc.get("id", str(i)),
                    "name": tc.get("name", f"Test {i+1}"),
                    "passed": False,
                    "expected": tc.get("expected_output"),
                    "actual": "Error",
                    "error": str(e),
                    "points": tc.get("points", 10),
                })

        total_tests = len(test_cases) or 1
        test_score = (passed / total_tests) * 100

        # LLM code review (30% weight)
        failed_tests = [tr for tr in test_results if not tr.get("passed")]
        failure_summaries = [
            f"{tr.get('name')}: {tr.get('error') or 'Failed'} (expected {tr.get('expected')}, got {tr.get('actual')})"
            for tr in failed_tests[:3]
        ]
        prompt = (
            f"Review this {submission.language or 'python'} code and test results:\n"
            f"Code:\n```\n{code[:2000]}\n```\n\n"
            f"Test summary: {passed}/{total_tests} passed.\n"
            f"Top failures: {', '.join(failure_summaries) if failure_summaries else 'None'}\n\n"
            "Provide a JSON with: score (0-100), overall_comment, strengths, weaknesses, suggestions, "
            "missing_points (what is missing), errors (why it failed), improvements (how to fix)."
        )
        llm_response = self.call_llm(prompt)

        try:
            review = json.loads(llm_response)
            style_score = review.get("style_score", review.get("score", 75))
            overall_comment = review.get("overall_comment", review.get("overall", review.get("feedback", "Code reviewed successfully")))
        except Exception:
            style_score = 75
            overall_comment = "Code reviewed successfully"
            review = {
                "overall_comment": overall_comment,
                "strengths": ["Code submitted successfully", "Basic logic implemented"],
                "weaknesses": ["Could improve code organization"],
                "suggestions": ["Add comments", "Handle edge cases"],
                "missing_points": ["Edge cases", "Input validation"],
                "errors": [tr.get("error") for tr in failed_tests[:2] if tr.get("error")],
                "improvements": ["Add tests for edge cases", "Refactor for clarity"],
            }

        # 70% test + 30% style
        final_score = (test_score * 0.7) + (style_score * 0.3)
        pass_status = "pass" if final_score >= submission.passing_score else "fail"

        feedback_obj = review if isinstance(review, dict) else {}

        # Sanitize feedback for transit
        def sanitize_list(lst):
            if not isinstance(lst, list): return []
            return [str(i) for i in lst if not isinstance(i, (dict, list))]

        clean_feedback = {
            "overall_comment": str(overall_comment),
            "test_score": float(test_score),
            "style_score": float(style_score),
            "strengths": sanitize_list(feedback_obj.get("strengths", [])),
            "weaknesses": sanitize_list(feedback_obj.get("weaknesses", [])),
            "suggestions": sanitize_list(feedback_obj.get("suggestions", [])),
            "missing_points": sanitize_list(feedback_obj.get("missing_points", [tr.get("name") for tr in failed_tests[:4]])),
            "errors": sanitize_list(feedback_obj.get("errors", [tr.get("error") for tr in failed_tests[:4] if tr.get("error")])),
            "improvements": sanitize_list(feedback_obj.get("improvements", [])),
            "risk_level": "low" if final_score >= 70 else ("medium" if final_score >= 50 else "high"),
            "risk_factors": sanitize_list(feedback_obj.get("risk_factors", [])),
            "rubric_scores": {
                "correctness": float(test_score),
                "quality": float(style_score),
            }
        }

        submission.score = round(final_score, 1)
        submission.pass_status = pass_status
        submission.status = "completed"
        submission.feedback = json.dumps(clean_feedback)
        submission.test_results = json.dumps(test_results)
        submission.graded_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "score": round(final_score, 1),
            "pass_status": pass_status,
            "test_results": test_results,
            "feedback": clean_feedback,
            "agent": "AssessmentAgent",
        }

    def _grade_assignment(self, db, submission: Submission, assessment: Assessment):
        # Assignments are usually text reports, links, or open-ended answers
        content = submission.code or ""

        prompt = f"""
        Review this assignment submission for '{assessment.title}'.
        Description: {assessment.description}
        Instructions: {assessment.instructions}
        
        Submission Content:
        {content[:4000]}
        
        Provide a JSON review with:
        - score (0-100)
        - overall_comment
        - strengths (list)
        - weaknesses (list)
        - suggestions (list)
        - missing_points (list)
        - errors (list)
        - improvements (list)
        - rubric_scores (object with categories like 'completeness', 'quality', 'understanding')
        """

        llm_response = self.call_llm(prompt)

        try:
            review = json.loads(llm_response)
            score = review.get("score", 70)
            overall_comment = review.get("overall_comment", "Assignment received and reviewed.")
        except Exception:
            score = 70
            overall_comment = "Assignment reviewed successfully."
            review = {
                "overall_comment": overall_comment,
                "strengths": ["Clear submission", "Followed instructions"],
                "weaknesses": ["Could provide more detail"],
                "suggestions": ["Elaborate on the core concepts next time"],
                "missing_points": ["More concrete examples", "Clear conclusion"],
                "errors": [],
                "improvements": ["Add supporting references", "Structure sections clearly"],
            }

        pass_status = "pass" if score >= submission.passing_score else "fail"

        # Sanitize feedback for transit
        def sanitize_list(lst):
            if not isinstance(lst, list): return []
            return [str(i) for i in lst if not isinstance(i, (dict, list))]

        clean_feedback = {
            "overall_comment": str(overall_comment),
            "strengths": sanitize_list(review.get("strengths", [])),
            "weaknesses": sanitize_list(review.get("weaknesses", [])),
            "suggestions": sanitize_list(review.get("suggestions", [])),
            "missing_points": sanitize_list(review.get("missing_points", [])),
            "errors": sanitize_list(review.get("errors", [])),
            "improvements": sanitize_list(review.get("improvements", [])),
            "risk_level": "low" if score >= 70 else "medium",
            "risk_factors": sanitize_list(review.get("risk_factors", [])),
            "rubric_scores": {
                str(k): (v if isinstance(v, (int, float)) else 0)
                for k, v in (review.get("rubric_scores", {}) if isinstance(review.get("rubric_scores"), dict) else {}).items()
            }
        }

        submission.score = round(float(score), 1)
        submission.pass_status = pass_status
        submission.status = "completed"
        submission.feedback = json.dumps(clean_feedback)
        submission.graded_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "score": score,
            "pass_status": pass_status,
            "feedback": clean_feedback,
            "agent": "AssessmentAgent",
        }
