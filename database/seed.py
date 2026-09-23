import json
from datetime import datetime, timezone
from database.db import Base, engine, SessionLocal
from backend.app.models.schema import (
    Student,
    Subject,
    Topic,
    Concept,
    Question,
    Note,
    StudentConceptProgress
)


def seed_database():
    """Initializes SQLite schema and populates clean demonstration data."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Demo Student
        demo_student = Student(
            id="demo-student-1",
            name="Alex Rivera",
            email="alex.rivera@example.edu",
            created_at=datetime.now(timezone.utc)
        )
        db.add(demo_student)

        # 2. Seed Subject: Machine Learning
        ml_subject = Subject(
            id="subject.ml",
            name="Machine Learning",
            description="Core foundations of statistical learning, loss functions, and iterative optimization.",
            icon="Brain"
        )
        db.add(ml_subject)

        # 3. Seed Topic: Optimization
        opt_topic = Topic(
            id="topic.ml.optimization",
            subject_id=ml_subject.id,
            name="Optimization",
            description="Mathematical techniques for minimizing loss functions and tuning model parameters.",
            order_index=1
        )
        db.add(opt_topic)

        # 4. Seed Concepts with stable structured IDs
        # Concept 1: Gradient
        concept_gradient = Concept(
            id="ml.optimization.gradient",
            topic_id=opt_topic.id,
            name="Gradient & Directional Derivatives",
            description="Understanding the gradient vector as the direction of steepest ascent.",
            order_index=1,
            prerequisite_concept_id=None
        )
        db.add(concept_gradient)

        # Concept 2: Learning Rate
        concept_lr = Concept(
            id="ml.optimization.learning_rate",
            topic_id=opt_topic.id,
            name="Learning Rate & Step Size",
            description="Tuning step size alpha to balance convergence speed against numerical divergence.",
            order_index=2,
            prerequisite_concept_id=concept_gradient.id
        )
        db.add(concept_lr)

        # Concept 3: Gradient Descent
        concept_gd = Concept(
            id="ml.optimization.gradient_descent",
            topic_id=opt_topic.id,
            name="Gradient Descent Algorithm",
            description="Iterative first-order optimization algorithm for finding parameter local minima.",
            order_index=3,
            prerequisite_concept_id=concept_lr.id
        )
        db.add(concept_gd)
        db.flush()

        # 5. Seed Markdown Notes
        note_gradient = Note(
            id="note.ml.optimization.gradient",
            concept_id=concept_gradient.id,
            title="Mastering Gradients & Directional Derivatives",
            markdown_content="""# Gradient & Directional Derivatives

The **gradient** is one of the most fundamental concepts in multivariable calculus and machine learning optimization.

## 1. What is a Gradient?
For a scalar multivariable function $f(x_1, x_2, \\dots, x_n)$, the gradient $\\nabla f$ is a vector composed of all its first-order partial derivatives:

$$\\nabla f(\\mathbf{x}) = \\left[ \\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T$$

## 2. Geometric Meaning
- **Steepest Ascent**: $\\nabla f(\\mathbf{x})$ points in the direction of greatest instantaneous increase of the function.
- **Steepest Descent**: $-\\nabla f(\\mathbf{x})$ points in the exact opposite direction—the direction of greatest decrease.
- **Magnitude**: $\\|\\nabla f(\\mathbf{x})\\|$ represents the slope or rate of increase along that steepest direction.
- **Orthogonality**: At any point on a level curve (contour line) where $f(\\mathbf{x}) = c$, the gradient vector is perpendicular (orthogonal) to the tangent of the contour.

## 3. Stationary Points
When $\\nabla f(\\mathbf{x}) = \\mathbf{0}$, the slope in every direction is zero. This point could be:
1. A **local minimum**
2. A **local maximum**
3. A **saddle point**
""",
            is_ai_generated=False
        )
        db.add(note_gradient)

        note_lr = Note(
            id="note.ml.optimization.learning_rate",
            concept_id=concept_lr.id,
            title="Learning Rate & Step Size Tuning",
            markdown_content="""# Learning Rate & Step Size ($\\alpha$)

The **learning rate** (often denoted $\\alpha$ or $\\eta$) is a critical hyperparameter that scales the size of each step taken during gradient descent.

## 1. The Core Update Rule
$$w_{t+1} = w_t - \\alpha \\cdot \\nabla L(w_t)$$

- **$\\\\nabla L(w_t)$**: Tells us *which direction* to step.
- **$\\\\alpha$**: Dictates *how far* we jump in that direction.

## 2. The Trade-Offs

### Scenario A: Learning Rate Too Small ($\\\\alpha \\to 0$)
- **Behavior**: Tiny steps along the loss surface.
- **Consequence**: Extremely slow convergence; high computational cost; easily trapped in shallow local plateaus.

### Scenario B: Learning Rate Too Large ($\\\\alpha \\gg 1$)
- **Behavior**: Overshooting the minimum.
- **Consequence**: Oscillation across valleys, loss explosion (divergence/NaNs).

### Scenario C: Well-Tuned Learning Rate
- **Behavior**: Smooth, steady descent toward the optimal parameter configuration.

## 3. Diagnostic Tip
If your loss function increases exponentially during training, the first hyperparameter to reduce by an order of magnitude is the **learning rate**.
""",
            is_ai_generated=False
        )
        db.add(note_lr)

        note_gd = Note(
            id="note.ml.optimization.gradient_descent",
            concept_id=concept_gd.id,
            title="The Gradient Descent Algorithm",
            markdown_content="""# Gradient Descent Algorithm

**Gradient Descent** is an iterative first-order optimization algorithm used to minimize objective loss functions in machine learning models.

## 1. The Algorithm Step-by-Step
1. **Initialize Parameters**: Start with random or zero weights $\\mathbf{w}_0$.
2. **Compute Loss**: Calculate the objective error $L(\\mathbf{w}_t)$ on training data.
3. **Calculate Gradient**: Compute the partial derivatives $\\nabla L(\\mathbf{w}_t)$.
4. **Update Weights**: Step in the negative gradient direction:
   $$\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\alpha \\nabla L(\\mathbf{w}_t)$$
5. **Check Convergence**: Repeat until $|\\nabla L(\\mathbf{w})| < \\epsilon$ or maximum epochs are reached.

## 2. Variants of Gradient Descent
- **Batch Gradient Descent**: Uses the entire dataset to compute $\\nabla L$. Stable but computationally heavy for large datasets.
- **Stochastic Gradient Descent (SGD)**: Updates weights using one sample at a time. Fast and noisy, helping escape shallow local minima.
- **Mini-Batch Gradient Descent**: Uses small batches (e.g. 32, 64, 128 samples). The standard in modern deep learning.

## 3. Key Limitations
- Susceptible to saddle points in high-dimensional non-convex spaces.
- Sensitive to feature scale (requires feature normalization/standardization).
""",
            is_ai_generated=False
        )
        db.add(note_gd)

        # 6. Seed Validated Questions
        questions_data = [
            # Gradient Questions
            {
                "id": "q-grad-1",
                "concept_id": concept_gradient.id,
                "question_text": "What does the gradient vector ∇f(x) geometrically represent for a differentiable multivariable function?",
                "options": [
                    {"id": "A", "text": "The direction of steepest ascent of the function"},
                    {"id": "B", "text": "The minimum curvature of the contour surface"},
                    {"id": "C", "text": "The tangent plane to the global coordinate origin"},
                    {"id": "D", "text": "The average value of the function across its domain"}
                ],
                "correct_option": "A",
                "explanation": "The gradient vector contains partial derivatives and always points in the direction of the greatest instantaneous rate of increase (steepest ascent).",
                "difficulty": "easy"
            },
            {
                "id": "q-grad-2",
                "concept_id": concept_gradient.id,
                "question_text": "If the gradient of a loss function at parameter point w is [0, 0, 0]^T, what does this point represent?",
                "options": [
                    {"id": "A", "text": "A stationary point such as a minimum, maximum, or saddle point"},
                    {"id": "B", "text": "A point where the loss is guaranteed to be strictly infinite"},
                    {"id": "C", "text": "A region where the model parameters cannot be stored"},
                    {"id": "D", "text": "A boundary where the learning rate must be negative"}
                ],
                "correct_option": "A",
                "explanation": "When ∇L(w) = 0, the first derivatives vanish, indicating a stationary point (local minimum, local maximum, or saddle point).",
                "difficulty": "medium"
            },
            {
                "id": "q-grad-3",
                "concept_id": concept_gradient.id,
                "question_text": "What is the relationship between the gradient vector and the level curves (contour lines) of a function?",
                "options": [
                    {"id": "A", "text": "The gradient vector is orthogonal (perpendicular) to the contour line"},
                    {"id": "B", "text": "The gradient vector is always parallel to the contour line"},
                    {"id": "C", "text": "The gradient vector has zero magnitude along contour lines"},
                    {"id": "D", "text": "The gradient vector only exists outside the contour plane"}
                ],
                "correct_option": "A",
                "explanation": "The directional derivative along a tangent to a contour line is zero; therefore, the gradient is orthogonal to the contour curve.",
                "difficulty": "medium"
            },
            {
                "id": "q-grad-4",
                "concept_id": concept_gradient.id,
                "question_text": "To minimize a function f(x) via iterative updates, in which direction should steps be taken?",
                "options": [
                    {"id": "A", "text": "In the negative gradient direction -∇f(x)"},
                    {"id": "B", "text": "In the positive gradient direction +∇f(x)"},
                    {"id": "C", "text": "In the direction parallel to the Hessian diagonal"},
                    {"id": "D", "text": "In a random direction orthogonal to ∇f(x)"}
                ],
                "correct_option": "A",
                "explanation": "Because +∇f points along steepest increase, taking steps in the opposite direction (-∇f) decreases the function value most rapidly.",
                "difficulty": "easy"
            },
            {
                "id": "q-grad-5",
                "concept_id": concept_gradient.id,
                "question_text": "For a two-variable function f(x, y) = x^2 + 3y^2, what is the gradient vector ∇f(x, y)?",
                "options": [
                    {"id": "A", "text": "[2x, 6y]"},
                    {"id": "B", "text": "[x^2, 3y^2]"},
                    {"id": "C", "text": "[2, 6]"},
                    {"id": "D", "text": "[2x + 6y, 0]"}
                ],
                "correct_option": "A",
                "explanation": "Taking partial derivatives: ∂f/∂x = 2x and ∂f/∂y = 6y, so ∇f(x, y) = [2x, 6y].",
                "difficulty": "medium"
            },

            # Learning Rate Questions
            {
                "id": "q-lr-1",
                "concept_id": concept_lr.id,
                "question_text": "What is the primary danger of setting the learning rate hyperparameter too high during model training?",
                "options": [
                    {"id": "A", "text": "The parameters may overshoot the minimum and cause the loss to diverge"},
                    {"id": "B", "text": "The model will instantly memorize the training dataset perfectly"},
                    {"id": "C", "text": "The training loop will terminate prematurely on epoch zero"},
                    {"id": "D", "text": "The gradient vector will become mathematically undefined everywhere"}
                ],
                "correct_option": "A",
                "explanation": "A large learning rate causes big jumps that can bounce out of the loss valley, causing numerical instability and divergence.",
                "difficulty": "easy"
            },
            {
                "id": "q-lr-2",
                "concept_id": concept_lr.id,
                "question_text": "If a student observes that training loss decreases at an imperceptibly slow rate across 1000 epochs, what is the most likely cause?",
                "options": [
                    {"id": "A", "text": "The learning rate is set to an excessively small value"},
                    {"id": "B", "text": "The learning rate is infinitely large and saturated"},
                    {"id": "C", "text": "The loss function lacks any partial derivatives"},
                    {"id": "D", "text": "The weights are being multiplied rather than added"}
                ],
                "correct_option": "A",
                "explanation": "An overly conservative (tiny) learning rate takes minuscule step sizes, requiring impractical numbers of iterations to converge.",
                "difficulty": "easy"
            },
            {
                "id": "q-lr-3",
                "concept_id": concept_lr.id,
                "question_text": "In the standard update equation w_{t+1} = w_t - alpha * g_t, what role does alpha play?",
                "options": [
                    {"id": "A", "text": "It scales the magnitude of the step taken along the gradient vector"},
                    {"id": "B", "text": "It dictates the number of layers in the neural network architecture"},
                    {"id": "C", "text": "It normalizes the input dataset features to unit variance"},
                    {"id": "D", "text": "It replaces the gradient vector with a random normal distribution"}
                ],
                "correct_option": "A",
                "explanation": "Alpha (the learning rate) acts as a scaling coefficient that controls the step magnitude along the descent direction.",
                "difficulty": "medium"
            },
            {
                "id": "q-lr-4",
                "concept_id": concept_lr.id,
                "question_text": "What is the goal of learning rate decay schedules (e.g. step decay or cosine annealing)?",
                "options": [
                    {"id": "A", "text": "To take larger exploratory steps early and fine-tune near the minimum later"},
                    {"id": "B", "text": "To ensure that all gradients are permanently converted to positive numbers"},
                    {"id": "C", "text": "To double the step size exponentially as the loss approaches zero"},
                    {"id": "D", "text": "To eliminate the need for computing partial derivatives entirely"}
                ],
                "correct_option": "A",
                "explanation": "Starting with a higher learning rate allows rapid initial progress, while decaying it helps settle precisely into narrow minima.",
                "difficulty": "medium"
            },
            {
                "id": "q-lr-5",
                "concept_id": concept_lr.id,
                "question_text": "Why might learning rate tuning be especially difficult on ill-conditioned loss surfaces with disparate curvature?",
                "options": [
                    {"id": "A", "text": "A single scalar rate may oscillate in steep directions while creeping in gentle ones"},
                    {"id": "B", "text": "Curvature causes the gradient vector to point in four directions simultaneously"},
                    {"id": "C", "text": "Ill-conditioned surfaces cannot be represented with floating point numbers"},
                    {"id": "D", "text": "The learning rate becomes negative when curvature is non-zero"}
                ],
                "correct_option": "A",
                "explanation": "When eigenvalues of the Hessian differ greatly (ravines), standard GD with a single learning rate oscillates across walls while making slow progress along the base.",
                "difficulty": "hard"
            },

            # Gradient Descent Questions
            {
                "id": "q-gd-1",
                "concept_id": concept_gd.id,
                "question_text": "What is the primary computational difference between Batch Gradient Descent and Stochastic Gradient Descent (SGD)?",
                "options": [
                    {"id": "A", "text": "Batch GD uses all training samples per step, while SGD uses one sample per step"},
                    {"id": "B", "text": "Batch GD updates weights randomly, while SGD uses exact matrix inversion"},
                    {"id": "C", "text": "Batch GD requires no learning rate, while SGD requires three separate rates"},
                    {"id": "D", "text": "Batch GD is only used for reinforcement learning, whereas SGD is for classification"}
                ],
                "correct_option": "A",
                "explanation": "Batch Gradient Descent computes the true gradient over the entire dataset per update, whereas SGD updates weights based on a single training example.",
                "difficulty": "easy"
            },
            {
                "id": "q-gd-2",
                "concept_id": concept_gd.id,
                "question_text": "Why is Mini-batch Gradient Descent preferred in practice over pure Batch GD for deep learning?",
                "options": [
                    {"id": "A", "text": "It provides GPU vectorization efficiency while offering faster, frequent updates"},
                    {"id": "B", "text": "It guarantees that the model will never overfit the training dataset"},
                    {"id": "C", "text": "It completely removes the mathematical necessity of computing backpropagation"},
                    {"id": "D", "text": "It computes the global minimum of any non-convex loss in a single iteration"}
                ],
                "correct_option": "A",
                "explanation": "Mini-batch GD strikes the optimal balance: it exploits GPU matrix parallelism on batches (e.g. 64 items) while updating weights much more frequently than full-batch GD.",
                "difficulty": "medium"
            },
            {
                "id": "q-gd-3",
                "concept_id": concept_gd.id,
                "question_text": "In standard Gradient Descent, what happens to the weight update step size as the parameters approach a smooth local minimum?",
                "options": [
                    {"id": "A", "text": "The step size naturally shrinks because the gradient magnitude decreases toward zero"},
                    {"id": "B", "text": "The step size automatically expands exponentially to push past the minimum"},
                    {"id": "C", "text": "The step size remains constant regardless of the slope of the loss surface"},
                    {"id": "D", "text": "The step size reverses direction and climbs back up the loss curve"}
                ],
                "correct_option": "A",
                "explanation": "Because the update is proportional to ∇L(w) and ∇L(w) → 0 near a smooth minimum, step sizes automatically decrease.",
                "difficulty": "medium"
            },
            {
                "id": "q-gd-4",
                "concept_id": concept_gd.id,
                "question_text": "Which condition serves as a standard stopping criterion for the Gradient Descent iterative loop?",
                "options": [
                    {"id": "A", "text": "When the norm of the gradient ||∇L(w)|| drops below a predefined threshold epsilon"},
                    {"id": "B", "text": "When the learning rate alpha reaches zero during fixed-rate training"},
                    {"id": "C", "text": "When all weight parameters become equal to exactly 1.0"},
                    {"id": "D", "text": "When the training dataset has been duplicated five times"}
                ],
                "correct_option": "A",
                "explanation": "When ||∇L(w)|| < ε or when the change in loss between successive epochs is negligible, the algorithm is considered converged.",
                "difficulty": "medium"
            },
            {
                "id": "q-gd-5",
                "concept_id": concept_gd.id,
                "question_text": "Why can Feature Scaling (e.g. Standardization) dramatically accelerate convergence in Gradient Descent?",
                "options": [
                    {"id": "A", "text": "It makes the loss contours more spherical, avoiding zig-zagging in elongated ravines"},
                    {"id": "B", "text": "It converts non-linear activation functions into pure linear equations"},
                    {"id": "C", "text": "It reduces the number of parameters in the model by half"},
                    {"id": "D", "text": "It forces all local minima to merge into a single global minimum"}
                ],
                "correct_option": "A",
                "explanation": "Unscaled features create elliptical, elongated loss contours causing oscillating gradients. Standardization yields spherical contours where the negative gradient points straight toward the minimum.",
                "difficulty": "hard"
            }
        ]

        for q_dict in questions_data:
            q = Question(
                id=q_dict["id"],
                concept_id=q_dict["concept_id"],
                question_text=q_dict["question_text"],
                options=q_dict["options"],
                correct_option=q_dict["correct_option"],
                explanation=q_dict["explanation"],
                difficulty=q_dict["difficulty"],
                is_ai_generated=False,
                is_validated=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(q)

        # 7. Seed Initial Concept Progress for Demo Student
        # Gradient: Strong (90%)
        p1 = StudentConceptProgress(
            id="prog-demo-1",
            student_id=demo_student.id,
            concept_id=concept_gradient.id,
            attempts_count=5,
            correct_count=5,
            mastery_score=1.0,
            status="strong",
            last_updated=datetime.now(timezone.utc)
        )
        db.add(p1)

        # Learning Rate: Needs Practice (60%)
        p2 = StudentConceptProgress(
            id="prog-demo-2",
            student_id=demo_student.id,
            concept_id=concept_lr.id,
            attempts_count=5,
            correct_count=3,
            mastery_score=0.6,
            status="needs_practice",
            last_updated=datetime.now(timezone.utc)
        )
        db.add(p2)

        # Gradient Descent: Not Started
        p3 = StudentConceptProgress(
            id="prog-demo-3",
            student_id=demo_student.id,
            concept_id=concept_gd.id,
            attempts_count=0,
            correct_count=0,
            mastery_score=0.0,
            status="not_started",
            last_updated=datetime.now(timezone.utc)
        )
        db.add(p3)

        db.commit()
        print("Database seeded successfully with Demo Student, ML Optimization concepts, Notes, and Questions.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
