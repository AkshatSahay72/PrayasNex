import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from database.seed import seed_database

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_seed():
    seed_database()


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_render_health_probe():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}



def test_get_subjects_and_topics():
    response = client.get("/api/subjects?student_id=demo-student-1")
    assert response.status_code == 200
    subjects = response.json()
    assert len(subjects) >= 1
    assert subjects[0]["name"] == "Machine Learning"
    assert len(subjects[0]["topics"]) >= 1
    assert len(subjects[0]["topics"][0]["concepts"]) == 3


def test_get_concept_detail():
    response = client.get("/api/concepts/ml.optimization.gradient_descent?student_id=demo-student-1")
    assert response.status_code == 200
    concept = response.json()
    assert concept["id"] == "ml.optimization.gradient_descent"
    assert concept["name"] == "Gradient Descent Algorithm"
    assert concept["prerequisite_concept_id"] == "ml.optimization.learning_rate"


def test_get_secure_assessment_questions():
    response = client.get("/api/assessments/questions?concept_id=ml.optimization.gradient_descent&limit=5")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 5
    for q in questions:
        # Crucial: correct answer must NOT be leaked
        assert "correct_option" not in q
        assert "explanation" not in q
        assert len(q["options"]) == 4


def test_assessment_submission_flow():
    # Submit answers for Gradient Descent
    # Question 1 correct is A, Question 2 correct is A
    payload = {
        "student_id": "demo-student-1",
        "concept_id": "ml.optimization.gradient_descent",
        "answers": [
            {"question_id": "q-gd-1", "selected_option": "A"},
            {"question_id": "q-gd-2", "selected_option": "B"}, # Wrong
            {"question_id": "q-gd-3", "selected_option": "C"}, # Wrong
            {"question_id": "q-gd-4", "selected_option": "D"}, # Wrong
            {"question_id": "q-gd-5", "selected_option": "A"}  # Correct -> 2/5 = 40% (weak)
        ]
    }
    response = client.post("/api/assessments/submit", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["total_questions"] == 5
    assert res["correct_answers"] == 2
    assert res["score_percentage"] == 40.0
    assert res["status"] == "weak"
    assert res["recommendation"] is not None
    assert res["recommendation"]["status"] == "weak"


def test_get_notes():
    response = client.get("/api/notes/ml.optimization.gradient")
    assert response.status_code == 200
    note = response.json()
    assert "Gradient" in note["title"]
    assert len(note["markdown_content"]) > 100


def test_get_student_dashboard():
    response = client.get("/api/students/demo-student-1/dashboard")
    assert response.status_code == 200
    dash = response.json()
    assert dash["student_name"] == "Alex Rivera"
    assert len(dash["all_progress"]) == 3


def test_ai_curriculum_generation_and_diagnostic():
    # 1. Generate full curriculum with AI
    curriculum_payload = {
        "subject_name": "Operating Systems",
        "description": "Process management, memory virtualization, and file systems",
        "num_topics": 2,
        "concepts_per_topic": 2
    }
    resp = client.post("/api/subjects/ai-generate", json=curriculum_payload)
    assert resp.status_code == 200
    subject_data = resp.json()
    assert "Operating Systems" in subject_data["name"]
    assert len(subject_data["topics"]) >= 1

    subject_id = subject_data["id"]

    # 2. Fetch diagnostic baseline questions for this new subject
    diag_resp = client.get(f"/api/assessments/diagnostic?subject_id={subject_id}")
    assert diag_resp.status_code == 200
    diag_questions = diag_resp.json()
    assert len(diag_questions) >= 1

    # 3. Submit diagnostic test answers
    diag_answers = [
        {
            "question_id": q["id"],
            "concept_id": q["concept_id"],
            "selected_option": "A"
        }
        for q in diag_questions
    ]
    sub_resp = client.post(
        "/api/assessments/submit-diagnostic",
        json={
            "student_id": "demo-student-1",
            "subject_id": subject_id,
            "answers": diag_answers
        }
    )
    assert sub_resp.status_code == 200
    diag_result = sub_resp.json()
    assert diag_result["subject_id"] == subject_id
    assert "overall_score" in diag_result
    assert len(diag_result["concept_breakdown"]) >= 1


def test_ai_generate_concept_and_note():
    # Fetch first topic
    subjects_resp = client.get("/api/subjects")
    topics = subjects_resp.json()[0]["topics"]
    target_topic_id = topics[0]["id"]

    # Generate concept under topic
    concept_resp = client.post(
        f"/api/subjects/topics/{target_topic_id}/ai-generate-concept",
        json={"concept_hint": "Momentum Optimizer"}
    )
    assert concept_resp.status_code == 200
    concept_data = concept_resp.json()
    assert "Momentum" in concept_data["name"]

    # Generate custom AI study note
    note_resp = client.post(
        "/api/notes/generate",
        json={
            "concept_id": concept_data["id"],
            "student_id": "demo-student-1",
            "focus_areas": ["Physics-based momentum analogies"]
        }
    )
    assert note_resp.status_code == 200
    note_data = note_resp.json()
    assert len(note_data["markdown_content"]) > 50

