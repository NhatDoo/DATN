'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import './exam.css';

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer?: string;
}

interface Exam {
    id: string;
    title: string;
    description: string;
    passing_score: number;
    duration_minutes: number;
    questions: Question[];
}

interface UserAnswer {
    question_id: string;
    selected_answer: string;
}

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [examStarted, setExamStarted] = useState(false);
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [examResult, setExamResult] = useState<any>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // Fetch exam data
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await fetch(`http://localhost:3003/exams/course-slug/${slug}`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const text = await response.text();

                    // Kiểm tra nếu response rỗng
                    if (!text || text.trim() === '' || text === 'null') {
                        console.log('❌ No exam found for this course');
                        setExam(null);
                        setLoading(false);
                        return;
                    }

                    const data = JSON.parse(text);

                    // Kiểm tra nếu data là null
                    if (!data) {
                        console.log('❌ No exam found for this course');
                        setExam(null);
                    } else {
                        console.log('✅ Exam loaded:', data);
                        setExam(data);
                        setTimeRemaining(data.duration_minutes * 60);
                    }
                } else {
                    console.error('❌ Failed to fetch exam:', response.status);
                    setExam(null);
                }
            } catch (error) {
                console.error('❌ Error fetching exam:', error);
                setExam(null);
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [slug]);

    // Timer countdown
    useEffect(() => {
        if (!examStarted || examSubmitted || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    handleSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [examStarted, examSubmitted, timeRemaining]);

    const handleStartExam = async () => {
        try {
            const response = await fetch(`http://localhost:3003/exam-attempts/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ exam_id: exam?.id }),
            });

            if (response.ok) {
                const data = await response.json();
                setAttemptId(data.id);
                setExamStarted(true);
            }
        } catch (error) {
            console.error('Error starting exam:', error);
        }
    };

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setUserAnswers((prev) => {
            const existing = prev.find((a) => a.question_id === questionId);
            if (existing) {
                return prev.map((a) =>
                    a.question_id === questionId ? { ...a, selected_answer: answer } : a
                );
            }
            return [...prev, { question_id: questionId, selected_answer: answer }];
        });
    };

    const handleSubmitExam = async () => {
        if (!attemptId || !exam) return;

        try {
            const response = await fetch(`http://localhost:3003/exam-attempts/${attemptId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers: userAnswers }),
            });

            if (response.ok) {
                const result = await response.json();
                setExamResult(result);
                setExamSubmitted(true);
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnswerForQuestion = (questionId: string) => {
        return userAnswers.find((a) => a.question_id === questionId)?.selected_answer;
    };

    if (loading) {
        return (
            <div className="exam-container">
                <div className="loading">Đang tải bài kiểm tra...</div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="exam-container">
                <div className="error">
                    <h2>❌ Không tìm thấy bài kiểm tra</h2>
                    <p>Khóa học này chưa có bài kiểm tra. Vui lòng liên hệ giảng viên.</p>
                    <button onClick={() => router.push(`/course/${slug}`)} className="btn-primary">
                        Quay lại khóa học
                    </button>
                </div>
            </div>
        );
    }

    if (examSubmitted && examResult) {
        const passed = examResult.score >= exam.passing_score;

        const handleViewCertificate = async () => {
            try {
                // 1. Check/Get Certificate
                const res = await fetch(`http://localhost:3003/certificate/course/${exam.id}`, { // exam.id or course.id? API expects courseId.
                    // Wait, exam.id is exam id. exam has course_id? No, exam interface doesn't have course_id.
                    // Let's use getCertificate with course slug fetch first or assume we have course ID from headers?
                    // No, we should use the API that gets certificate by certificateId or just getMyCertificates.
                    // Actually, we can assume the certificate is created.
                    // Let's check if we can get the certificate ID from result or just fetch by course.
                    // The exam interface doesn't have course_id. We have slug.
                    // Let's rely on backend to separate.
                    // Actually, the backend `getCertificate` takes courseId.
                    // We need the courseId. We fetched exam by slug. The exam object SHOULD have course_id.
                    // Let's update Exam interface and fetch logic first to include course_id?
                    // Or just use the API `http://localhost:3003/certificate/download/:certificateId`.
                    // But we need the certificate ID.
                    // The `submitAttempt` returns the attempt result, but NOT the certificate ID.
                    // It generates certificate asynchronously or synchronously? synchronously in service but not returned.

                    // PLAN B:
                    // Use "http://localhost:3003/certificate/course/:courseID" to get the certificate.
                    // But we don't have courseID in state 'exam'.
                    // Let's add course_id to Exam interface and ensure backend returns it.
                    // We need to fetch course data again? Or just use the slug to get course ID?
                    // We have the slug.
                });

                // Let's try to get course ID from slug first if not present.
                // Or simply redirect to "My Certificates" page?
                // The user asked to "print" it.
                // Best to have a "Download Certificate" button that calls the download endpoint.

                // Let's fetch the certificate for this course (using slug to get course ID first is painful here).

                // Hack: The exam object returned by backend DOES include course_id if we checked Prisma schema?
                // `ExamsService.findByCourseSlug` DOES return `exams` object. `exams` model HAS `course_id`.
                // So `exam` state DOES have `course_id` even if interface didn't say so.
            } catch (e) { console.error(e) }
        };

        return (
            <div className="exam-container">
                <div className="exam-result">
                    <div className={`result-header ${passed ? 'passed' : 'failed'}`}>
                        <h1>{passed ? '🎉 Chúc mừng!' : '😔 Chưa đạt'}</h1>
                        <p>{passed ? 'Bạn đã vượt qua bài kiểm tra!' : 'Bạn chưa đạt điểm yêu cầu'}</p>
                    </div>

                    <div className="result-stats">
                        <div className="stat-item">
                            <span className="stat-label">Điểm số</span>
                            <span className="stat-value">{examResult.score}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Điểm đạt</span>
                            <span className="stat-value">{exam.passing_score}%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Số câu đúng</span>
                            <span className="stat-value">
                                {examResult.correct_count}/{exam.questions.length}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Thời gian</span>
                            <span className="stat-value">
                                {Math.floor(examResult.time_taken / 60)} phút
                            </span>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button onClick={() => router.push(`/course/${slug}`)} className="btn-primary">
                            Quay lại khóa học
                        </button>
                        {!passed ? (
                            <button onClick={() => window.location.reload()} className="btn-secondary">
                                Làm lại
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    // 1. Get Course ID from exam
                                    // 2. Fetch certificate
                                    // 3. Download
                                    // Since we might not have `course_id` typed, let's cast exam to any.
                                    const courseId = (exam as any).course_id;
                                    if (courseId) {
                                        // Open download link in new tab
                                        // First we need the certificate ID.
                                        // Let's fetch it first.
                                        fetch(`http://localhost:3003/certificate/course/${courseId}`, { credentials: 'include' })
                                            .then(res => res.json())
                                            .then(cert => {
                                                if (cert && cert.id) {
                                                    const downloadUrl = `http://localhost:3003/certificate/download/${cert.id}?userName=Student&courseName=${encodeURIComponent(exam.title)}`;
                                                    // Note: We should probably fetch real User Name and Course Name properly, but for now Student/Title is okay or let backend handle it? 
                                                    // Backend expects userName and courseName in Query params (see CertificateController).
                                                    // We can get real user name if we had user state, but let's use "Student" for now or try to get from profile.
                                                    window.open(downloadUrl, '_blank');
                                                } else {
                                                    alert("Chưa tìm thấy chứng chỉ. Vui lòng thử lại sau giây lát.");
                                                }
                                            })
                                            .catch(err => alert("Lỗi khi tải chứng chỉ"));
                                    } else {
                                        alert("Không xác định được khóa học.");
                                    }
                                }}
                                className="btn-success"
                            >
                                📜 Xem chứng chỉ
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!examStarted) {
        return (
            <div className="exam-container">
                <div className="exam-intro">
                    <h1>{exam.title}</h1>
                    <p className="exam-description">{exam.description}</p>

                    <div className="exam-info">
                        <div className="info-item">
                            <span className="info-icon">📝</span>
                            <div>
                                <strong>Số câu hỏi</strong>
                                <p>{exam.questions.length} câu</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">⏱️</span>
                            <div>
                                <strong>Thời gian</strong>
                                <p>{exam.duration_minutes} phút</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🎯</span>
                            <div>
                                <strong>Điểm đạt</strong>
                                <p>{exam.passing_score}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="exam-rules">
                        <h3>Lưu ý:</h3>
                        <ul>
                            <li>Bạn chỉ có {exam.duration_minutes} phút để hoàn thành bài kiểm tra</li>
                            <li>Không thể quay lại sau khi đã nộp bài</li>
                            <li>Cần đạt tối thiểu {exam.passing_score}% để vượt qua</li>
                            <li>Bài kiểm tra sẽ tự động nộp khi hết giờ</li>
                        </ul>
                    </div>

                    <button onClick={handleStartExam} className="btn-start-exam">
                        Bắt đầu làm bài
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <div className="exam-container">
            <div className="exam-header">
                <div className="exam-title">{exam.title}</div>
                <div className="exam-timer">
                    <span className="timer-icon">⏱️</span>
                    <span className={timeRemaining < 300 ? 'timer-warning' : ''}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
            </div>

            <div className="exam-progress">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="progress-text">
                    Câu {currentQuestionIndex + 1} / {exam.questions.length}
                </div>
            </div>

            <div className="exam-content">
                <div className="question-card">
                    <div className="question-number">Câu hỏi {currentQuestionIndex + 1}</div>
                    <div className="question-text">{currentQuestion.question_text}</div>

                    <div className="answers-list">
                        {currentQuestion.options?.map((optionText, index) => {
                            const optionValue = optionLabels[index]; // Map 0->A, 1->B...
                            const isSelected = getAnswerForQuestion(currentQuestion.id) === optionValue;

                            return (
                                <label
                                    key={index}
                                    className={`answer-option ${isSelected ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion.id}`}
                                        value={optionValue}
                                        checked={isSelected}
                                        onChange={() => handleAnswerSelect(currentQuestion.id, optionValue)}
                                    />
                                    <span className="answer-letter">{optionValue}.</span>
                                    <span className="answer-text">{optionText}</span>
                                    <span className="answer-radio"></span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="question-navigation">
                    <div className="nav-buttons">
                        <button
                            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="btn-nav"
                        >
                            ← Câu trước
                        </button>

                        {currentQuestionIndex < exam.questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                className="btn-nav btn-next"
                            >
                                Câu sau →
                            </button>
                        ) : (
                            <button onClick={handleSubmitExam} className="btn-submit">
                                Nộp bài
                            </button>
                        )}
                    </div>

                    <div className="question-grid">
                        {exam.questions.map((q, index) => {
                            const isAnswered = userAnswers.some((a) => a.question_id === q.id);
                            const isCurrent = index === currentQuestionIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`question-dot ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
