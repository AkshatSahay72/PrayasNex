import json
import logging
import uuid
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.models.schema import Subject, Topic, Concept, Note, Question, Student, StudentConceptProgress
from backend.app.schemas.api_models import SubjectDetail, TopicWithConcepts, ConceptSummary
from backend.app.services.ai.groq_service import GroqService
from backend.app.validators.question_validator import QuestionValidator

logger = logging.getLogger("curriculum_generator")


def _to_slug(text: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9]+', '_', text.strip().lower()).strip('_')
    return cleaned or "item"


class CurriculumGenerator:
    """
    Generates entire curriculum modules (Subject -> Topics -> Concepts -> Study Notes -> MCQs)
    using Groq API with robust fallback templates.
    """

    @classmethod
    def generate_subject_curriculum(
        cls,
        db: Session,
        subject_name: str,
        description: Optional[str] = None,
        num_topics: int = 3,
        concepts_per_topic: int = 2
    ) -> SubjectDetail:
        """
        Queries Groq LLM to generate structured curriculum hierarchy.
        Persists everything to the database and returns full SubjectDetail.
        """
        system_prompt = (
            "You are an expert academic curriculum designer. "
            "Generate a rigorous, pedagogical course structure in strict JSON format. "
            "No conversational filler or markdown code blocks outside JSON."
        )

        user_prompt = f"""
Generate a structured curriculum for the academic subject: "{subject_name}".
Context/Description: {description or 'Standard core undergraduate syllabus.'}

Create exactly:
- {num_topics} distinct, logically sequenced Topics.
- {concepts_per_topic} progressive Concepts under each Topic.
- For each concept:
  1. Detailed pedagogical description (1-2 sentences).
  2. Prerequisite concept name (null for introductory concepts, or name of a preceding concept in this list).
  3. Comprehensive study note in GitHub-Flavored Markdown (including Overview, Core Mechanics, Mathematical/Architectural Principles, Pitfalls, and Practical Application).
  4. Exactly 2 high-quality multiple choice questions (with 4 distinct options, correct_option 'A'/'B'/'C'/'D', detailed explanation, and difficulty 'easy'/'medium'/'hard').

Return strictly valid JSON matching this schema:
{{
  "subject_name": "{subject_name}",
  "description": "Short high-level description",
  "topics": [
    {{
      "name": "Topic Title",
      "description": "Topic summary",
      "concepts": [
        {{
          "name": "Concept Title",
          "description": "Concept summary",
          "prerequisite_name": null,
          "study_note_markdown": "# Concept Title\\n\\n## 1. Overview...",
          "questions": [
            {{
              "question_text": "Detailed question prompt?",
              "options": [
                {{"id": "A", "text": "Option A"}},
                {{"id": "B", "text": "Option B"}},
                {{"id": "C", "text": "Option C"}},
                {{"id": "D", "text": "Option D"}}
              ],
              "correct_option": "A",
              "explanation": "Why A is correct and distractors are wrong.",
              "difficulty": "medium"
            }}
          ]
        }}
      ]
    }}
  ]
}}
"""

        raw_response = GroqService.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            json_mode=True,
            timeout_seconds=25.0
        )

        parsed_data = None
        if raw_response:
            try:
                parsed_data = json.loads(raw_response)
            except Exception as e:
                logger.warning(f"Failed to parse Groq curriculum JSON: {e}")

        if not parsed_data or "topics" not in parsed_data or not parsed_data["topics"]:
            logger.info("Using fallback curriculum generator")
            parsed_data = cls._get_fallback_curriculum(subject_name, description)

        return cls._persist_curriculum(db, parsed_data)

    @classmethod
    def generate_single_concept(
        cls,
        db: Session,
        topic_id: str,
        concept_name_hint: str
    ) -> ConceptSummary:
        """
        Generates a single concept with note and 2 MCQs under an existing topic using LLM.
        """
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            raise ValueError(f"Topic '{topic_id}' not found")

        subject_name = topic.subject.name if topic.subject else "Computer Science"

        system_prompt = "You are a university professor. Generate a concept with study guide and 2 MCQs in strict JSON format."
        user_prompt = f"""
Subject: {subject_name}
Topic: {topic.name}
Concept Topic/Hint: {concept_name_hint}

Return JSON with:
{{
  "name": "Refined Concept Title",
  "description": "Clear pedagogical description",
  "study_note_markdown": "# Title\\n\\n## 1. Overview\\n...",
  "questions": [
    {{
      "question_text": "Question prompt?",
      "options": [
        {{"id": "A", "text": "Opt A"}},
        {{"id": "B", "text": "Opt B"}},
        {{"id": "C", "text": "Opt C"}},
        {{"id": "D", "text": "Opt D"}}
      ],
      "correct_option": "A",
      "explanation": "Detailed pedagogical rationale.",
      "difficulty": "medium"
    }}
  ]
}}
"""
        raw_response = GroqService.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            json_mode=True,
            timeout_seconds=20.0
        )

        parsed = None
        if raw_response:
            try:
                parsed = json.loads(raw_response)
            except Exception:
                pass

        if not parsed or "name" not in parsed:
            parsed = {
                "name": concept_name_hint.title(),
                "description": f"Core mechanics and practical implementation of {concept_name_hint}.",
                "study_note_markdown": f"# {concept_name_hint.title()}\n\n## 1. Overview\n{concept_name_hint} is a foundational pillar in {topic.name}.\n\n## 2. Core Mechanics\nExamine the key state transitions, invariants, and edge cases.\n\n## 3. Practice\nTake the concept assessment to verify your retention.",
                "questions": [
                    {
                        "question_text": f"What is the primary operational objective of {concept_name_hint}?",
                        "options": [
                            {"id": "A", "text": f"To optimize the correctness and throughput of {topic.name}"},
                            {"id": "B", "text": "To bypass all security layers without validation"},
                            {"id": "C", "text": "To execute synchronous blocking loops indefinitely"},
                            {"id": "D", "text": "To corrupt memory allocations across subroutines"}
                        ],
                        "correct_option": "A",
                        "explanation": f"The main purpose of {concept_name_hint} is to guarantee safe and optimized operation in {topic.name}.",
                        "difficulty": "medium"
                    }
                ]
            }

        # Create Concept
        slug = _to_slug(parsed["name"])
        subj_slug = _to_slug(subject_name)
        topic_slug = _to_slug(topic.name)
        concept_id = f"{subj_slug}.{topic_slug}.{slug}"
        if db.query(Concept).filter(Concept.id == concept_id).first():
            concept_id = f"{subj_slug}.{topic_slug}.{slug}_{int(datetime.now().timestamp()) % 10000}"

        order_idx = len(topic.concepts) + 1
        new_concept = Concept(
            id=concept_id,
            topic_id=topic.id,
            name=parsed["name"].strip(),
            description=parsed.get("description", "").strip(),
            order_index=order_idx
        )
        db.add(new_concept)
        db.flush()

        # Create Note
        note = Note(
            id=f"note.{new_concept.id}",
            concept_id=new_concept.id,
            title=f"Study Guide: {new_concept.name}",
            markdown_content=parsed.get("study_note_markdown", f"# {new_concept.name}\n\n{new_concept.description}").strip(),
            is_ai_generated=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(note)

        # Create Questions
        for q_dict in parsed.get("questions", []):
            try:
                is_valid, _ = QuestionValidator.validate(
                    {
                        "question": q_dict.get("question_text"),
                        "options": q_dict.get("options"),
                        "correct_option": q_dict.get("correct_option"),
                        "explanation": q_dict.get("explanation"),
                        "concept_id": new_concept.id,
                        "difficulty": q_dict.get("difficulty", "medium")
                    },
                    expected_concept_id=new_concept.id
                )
                if is_valid:
                    q = Question(
                        id=f"q-{uuid.uuid4().hex[:10]}",
                        concept_id=new_concept.id,
                        question_text=q_dict["question_text"].strip(),
                        options=q_dict["options"],
                        correct_option=q_dict["correct_option"].strip().upper(),
                        explanation=q_dict["explanation"].strip(),
                        difficulty=q_dict.get("difficulty", "medium"),
                        is_ai_generated=True,
                        is_validated=True,
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(q)
            except Exception as e:
                logger.warning(f"Skipping malformed generated question: {e}")

        # Initialize student progress
        students = db.query(Student).all()
        for s in students:
            p = StudentConceptProgress(
                id=f"prog-{s.id}-{new_concept.id}",
                student_id=s.id,
                concept_id=new_concept.id,
                attempts_count=0,
                correct_count=0,
                mastery_score=0.0,
                status="not_started"
            )
            db.add(p)

        db.commit()
        db.refresh(new_concept)

        q_count = db.query(Question).filter(Question.concept_id == new_concept.id).count()

        return ConceptSummary(
            id=new_concept.id,
            topic_id=new_concept.topic_id,
            name=new_concept.name,
            description=new_concept.description,
            order_index=new_concept.order_index,
            prerequisite_concept_id=None,
            prerequisite_concept_name=None,
            questions_count=q_count,
            student_status="not_started",
            student_mastery=0.0
        )

    @classmethod
    def _persist_curriculum(cls, db: Session, data: Dict[str, Any]) -> SubjectDetail:
        """Saves generated JSON structure into PostgreSQL database."""
        subj_name = data.get("subject_name", "New Subject").strip()
        subj_slug = _to_slug(subj_name)
        subj_id = f"subject.{subj_slug}"

        if db.query(Subject).filter(Subject.id == subj_id).first():
            subj_id = f"subject.{subj_slug}_{int(datetime.now().timestamp()) % 10000}"

        subject = Subject(
            id=subj_id,
            name=subj_name,
            description=data.get("description", "").strip(),
            icon="BookOpen"
        )
        db.add(subject)
        db.flush()

        concept_name_to_id: Dict[str, str] = {}
        pending_prereqs: List[tuple] = []

        # Create Topics and Concepts
        for t_idx, t_data in enumerate(data.get("topics", []), start=1):
            topic_name = t_data.get("name", f"Topic {t_idx}").strip()
            topic_slug = _to_slug(topic_name)
            topic_id = f"topic.{subj_slug}.{topic_slug}"
            if db.query(Topic).filter(Topic.id == topic_id).first():
                topic_id = f"topic.{subj_slug}.{topic_slug}_{int(datetime.now().timestamp()) % 10000}"

            topic = Topic(
                id=topic_id,
                subject_id=subject.id,
                name=topic_name,
                description=t_data.get("description", "").strip(),
                order_index=t_idx
            )
            db.add(topic)
            db.flush()

            for c_idx, c_data in enumerate(t_data.get("concepts", []), start=1):
                concept_name = c_data.get("name", f"Concept {c_idx}").strip()
                concept_slug = _to_slug(concept_name)
                concept_id = f"{subj_slug}.{topic_slug}.{concept_slug}"
                if db.query(Concept).filter(Concept.id == concept_id).first():
                    concept_id = f"{subj_slug}.{topic_slug}.{concept_slug}_{int(datetime.now().timestamp()) % 10000}"

                concept = Concept(
                    id=concept_id,
                    topic_id=topic.id,
                    name=concept_name,
                    description=c_data.get("description", "").strip(),
                    order_index=c_idx,
                    prerequisite_concept_id=None
                )
                db.add(concept)
                db.flush()

                concept_name_to_id[concept_name.lower()] = concept.id

                prereq_name = c_data.get("prerequisite_name")
                if prereq_name:
                    pending_prereqs.append((concept.id, str(prereq_name).lower()))

                # Note
                note_md = c_data.get("study_note_markdown", f"# {concept.name}\n\n{concept.description}").strip()
                note = Note(
                    id=f"note.{concept.id}",
                    concept_id=concept.id,
                    title=f"Study Guide: {concept.name}",
                    markdown_content=note_md,
                    is_ai_generated=True,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(note)

                # Questions
                for q_dict in c_data.get("questions", []):
                    try:
                        q_text = q_dict.get("question_text") or q_dict.get("question", "")
                        if not q_text:
                            continue

                        raw_opts = q_dict.get("options", [])
                        norm_opts = []
                        if isinstance(raw_opts, list):
                            for idx, opt in enumerate(raw_opts):
                                if isinstance(opt, dict):
                                    norm_opts.append({"id": opt.get("id", chr(65 + idx)), "text": opt.get("text", "")})
                                elif isinstance(opt, str):
                                    norm_opts.append({"id": chr(65 + idx), "text": opt})

                        correct_opt = (q_dict.get("correct_option") or q_dict.get("correct_answer") or q_dict.get("answer") or "A").strip().upper()
                        if len(correct_opt) > 1 and correct_opt[0] in "ABCD":
                            correct_opt = correct_opt[0]

                        expl = q_dict.get("explanation") or q_dict.get("rationale") or f"Option {correct_opt} is correct."

                        q = Question(
                            id=f"q-{uuid.uuid4().hex[:10]}",
                            concept_id=concept.id,
                            question_text=q_text.strip(),
                            options=norm_opts if len(norm_opts) == 4 else [
                                {"id": "A", "text": "Primary verified mechanic"},
                                {"id": "B", "text": "Secondary unverified distractor"},
                                {"id": "C", "text": "Irrelevant operational state"},
                                {"id": "D", "text": "None of the above"}
                            ],
                            correct_option=correct_opt if correct_opt in ["A", "B", "C", "D"] else "A",
                            explanation=expl.strip(),
                            difficulty=q_dict.get("difficulty", "medium"),
                            is_ai_generated=True,
                            is_validated=True,
                            created_at=datetime.now(timezone.utc)
                        )
                        db.add(q)
                    except Exception as e:
                        logger.warning(f"Error adding question: {e}")


                # Progress entries for demo students
                students = db.query(Student).all()
                for s in students:
                    p = StudentConceptProgress(
                        id=f"prog-{s.id}-{concept.id}",
                        student_id=s.id,
                        concept_id=concept.id,
                        attempts_count=0,
                        correct_count=0,
                        mastery_score=0.0,
                        status="not_started"
                    )
                    db.add(p)

        # Wire up prerequisites if matched
        for cid, prereq_name_str in pending_prereqs:
            for target_name, target_id in concept_name_to_id.items():
                if target_name in prereq_name_str or prereq_name_str in target_name:
                    c = db.query(Concept).filter(Concept.id == cid).first()
                    if c and target_id != cid:
                        c.prerequisite_concept_id = target_id
                    break

        db.commit()
        db.refresh(subject)

        # Build return response
        topics_resp = []
        for t in subject.topics:
            concepts_resp = []
            for c in t.concepts:
                q_count = db.query(Question).filter(Question.concept_id == c.id).count()
                prereq_name = c.prerequisite.name if c.prerequisite else None
                concepts_resp.append(
                    ConceptSummary(
                        id=c.id,
                        topic_id=c.topic_id,
                        name=c.name,
                        description=c.description,
                        order_index=c.order_index,
                        prerequisite_concept_id=c.prerequisite_concept_id,
                        prerequisite_concept_name=prereq_name,
                        questions_count=q_count,
                        student_status="not_started",
                        student_mastery=0.0
                    )
                )
            topics_resp.append(
                TopicWithConcepts(
                    id=t.id,
                    subject_id=t.subject_id,
                    name=t.name,
                    description=t.description,
                    order_index=t.order_index,
                    concepts=concepts_resp
                )
            )

        return SubjectDetail(
            id=subject.id,
            name=subject.name,
            description=subject.description,
            icon=subject.icon,
            topics=topics_resp
        )

    @classmethod
    def _get_fallback_curriculum(cls, subject_name: str, description: Optional[str]) -> Dict[str, Any]:
        """Provides a complete structured curriculum template if Groq API is offline."""
        clean_name = subject_name.strip()
        return {
            "subject_name": clean_name,
            "description": description or f"Comprehensive curriculum for {clean_name}.",
            "topics": [
                {
                    "name": f"Foundations of {clean_name}",
                    "description": f"Core terminology, architectural primitives, and operational constraints.",
                    "concepts": [
                        {
                            "name": f"{clean_name} Core Principles",
                            "description": "Foundational definitions, invariants, and fundamental models.",
                            "prerequisite_name": None,
                            "study_note_markdown": f"""# {clean_name} Core Principles

## 1. Overview
{clean_name} represents a foundational computational domain requiring rigorous understanding of state, resources, and algorithms.

## 2. Key Mechanics
- **Abstraction**: Isolating hardware and lower-level protocols behind uniform interfaces.
- **State Management**: Ensuring deterministic behavior across asynchronous operations.
- **Resource Constraints**: Balancing computational efficiency against latency and memory footprint.

## 3. Practice
Take the diagnostic assessment to verify your foundational intuition.
""",
                            "questions": [
                                {
                                    "question_text": f"In the context of {clean_name}, why is modular abstraction essential?",
                                    "options": [
                                        {"id": "A", "text": "It isolates internal implementation details behind clean, verifiable interfaces"},
                                        {"id": "B", "text": "It forces all subroutines to run synchronously on a single hardware thread"},
                                        {"id": "C", "text": "It bypasses error validation to maximize raw memory bandwidth"},
                                        {"id": "D", "text": "It replaces deterministic mathematical proofs with heuristics"}
                                    ],
                                    "correct_option": "A",
                                    "explanation": "Modular abstraction allows complex subsystems to evolve independently while maintaining verifiable contracts.",
                                    "difficulty": "medium"
                                }
                            ]
                        },
                        {
                            "name": f"{clean_name} Execution Models",
                            "description": "Runtime mechanics, dispatching, and control flow paradigms.",
                            "prerequisite_name": f"{clean_name} Core Principles",
                            "study_note_markdown": f"""# {clean_name} Execution Models

## 1. Overview
Execution models define how tasks are scheduled, dispatched, and synchronized in {clean_name}.

## 2. Common Pitfalls
- **Race Conditions**: Unsynchronized concurrent mutations leading to non-deterministic bugs.
- **Resource Starvation**: Unfair scheduling policies penalizing low-priority tasks indefinitely.
""",
                            "questions": [
                                {
                                    "question_text": f"What failure mode occurs when multiple concurrent tasks mutate shared state without synchronization?",
                                    "options": [
                                        {"id": "A", "text": "A race condition leading to non-deterministic state corruption"},
                                        {"id": "B", "text": "An automatic graceful shutdown of all background workers"},
                                        {"id": "C", "text": "An immediate hardware bus lock that prevents memory leakage"},
                                        {"id": "D", "text": "A complete static type inference verification failure"}
                                    ],
                                    "correct_option": "A",
                                    "explanation": "Without atomic synchronization or mutex primitives, concurrent writes produce race conditions.",
                                    "difficulty": "medium"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": f"Advanced {clean_name} Architectures",
                    "description": "Scalability, fault tolerance, and optimization heuristics.",
                    "concepts": [
                        {
                            "name": f"{clean_name} Optimization & Resilience",
                            "description": "High-throughput heuristics, caching hierarchies, and fault recovery.",
                            "prerequisite_name": f"{clean_name} Execution Models",
                            "study_note_markdown": f"""# {clean_name} Optimization & Resilience

## 1. Overview
High-performance systems in {clean_name} require systematic optimization and robust recovery strategies.

## 2. Core Mechanics
- **Caching**: Locality of reference to minimize high-cost remote retrievals.
- **Backpressure**: Preventing buffer overflow under heavy load spikes.
""",
                            "questions": [
                                {
                                    "question_text": f"How does implementing backpressure protect high-throughput systems in {clean_name}?",
                                    "options": [
                                        {"id": "A", "text": "It signals upstream producers to slow down when downstream buffers fill"},
                                        {"id": "B", "text": "It silently drops all incoming packets without logging"},
                                        {"id": "C", "text": "It allocates unlimited virtual memory to prevent queue backlogs"},
                                        {"id": "D", "text": "It disables network timeouts to avoid connection drops"}
                                    ],
                                    "correct_option": "A",
                                    "explanation": "Backpressure signals producers when consumers cannot keep pace, preventing out-of-memory crashes.",
                                    "difficulty": "medium"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
