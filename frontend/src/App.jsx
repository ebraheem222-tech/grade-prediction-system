import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './index.css';
import { TrendingUp } from 'lucide-react';

import Notification from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';
import Tabs from './components/Tabs';

import PredictionTab from './components/predict/PredictionTab';
import StudentsTab from './components/students/StudentsTab';
import CoursesTab from './components/courses/CoursesTab';
import GradesTab from './components/grades/GradesTab';
import DataTab from './components/data/DataTab';

function App() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transcripts, setTranscripts] = useState([]);

  const [activeTab, setActiveTab] = useState('predict');
  const [notification, setNotification] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: '',
    id: '',
    message: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCsvUpload = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!Array.isArray(results.data)) {
          showNotification('CSV parse error', 'error');
          return;
        }
        if (type === 'students') {
          const updated = [...students, ...results.data];
          setStudents(updated);
          localStorage.setItem('students', JSON.stringify(updated));
          showNotification(`Uploaded ${results.data.length} students`);
        } else if (type === 'courses') {
          const updated = [...courses, ...results.data];
          setCourses(updated);
          localStorage.setItem('courses', JSON.stringify(updated));
          showNotification(`Uploaded ${results.data.length} courses`);
        } else if (type === 'transcripts') {
          const updated = [...transcripts, ...results.data];
          setTranscripts(updated);
          localStorage.setItem('transcripts', JSON.stringify(updated));
          showNotification(`Uploaded ${results.data.length} transcript records`);
        }
      },
      error: (error) => {
        showNotification(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  useEffect(() => {
    const s = localStorage.getItem('students');
    const c = localStorage.getItem('courses');
    const t = localStorage.getItem('transcripts');
    if (s) setStudents(JSON.parse(s));
    if (c) setCourses(JSON.parse(c));
    if (t) setTranscripts(JSON.parse(t));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__students = students;
      window.__courses = courses;
      window.__transcripts = transcripts;
    }
  }, [students, courses, transcripts]);

  const addStudent = (newStudent) => {
    if (!newStudent.studentId || !newStudent.firstName || !newStudent.lastName) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const updated = [...students, { ...newStudent }];
    setStudents(updated);
    localStorage.setItem('students', JSON.stringify(updated));
    showNotification('Student added successfully');
  };

  const addCourse = (newCourse) => {
    if (!newCourse.courseId || !newCourse.code || !newCourse.name) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const updated = [...courses, { ...newCourse }];
    setCourses(updated);
    localStorage.setItem('courses', JSON.stringify(updated));
    showNotification('Course added successfully');
  };

  const addGrade = (newGrade) => {
    if (!newGrade.studentId || (!newGrade.courseId && !newGrade.courseCode) || !newGrade.grade) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const final = { ...newGrade };
    if (newGrade.courseCode && !newGrade.courseId) {
      const course = courses.find(
        c => (c.code || '').trim().toUpperCase() === (newGrade.courseCode || '').trim().toUpperCase()
      );
      if (course) final.courseId = course.courseId;
    }
    const updated = [...transcripts, final];
    setTranscripts(updated);
    localStorage.setItem('transcripts', JSON.stringify(updated));
    showNotification('Grade added successfully');
  };

  const deleteStudentAsk = (studentId) => {
    setDeleteConfirm({
      show: true,
      type: 'student',
      id: studentId,
      message: `Are you sure you want to delete student ${studentId}? This will also delete all their grades.`
    });
  };

  const deleteCourseAsk = (courseId) => {
    setDeleteConfirm({
      show: true,
      type: 'course',
      id: courseId,
      message: `Are you sure you want to delete course ${courseId}? This will also delete all grades for this course.`
    });
  };

  const deleteGradeAsk = (index) => {
    const grade = transcripts[index];
    setDeleteConfirm({
      show: true,
      type: 'grade',
      id: index,
      message: `Are you sure you want to delete this grade record (${grade.studentId} - ${grade.courseId || grade.courseCode})?`
    });
  };

  const clearAllDataAsk = () => {
    setDeleteConfirm({
      show: true,
      type: 'all',
      id: '',
      message: 'Are you sure you want to delete ALL data? This action cannot be undone!'
    });
  };

  const confirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'student') {
      const updatedStudents = students.filter(s => s.studentId !== id);
      const updatedTranscripts = transcripts.filter(t => t.studentId !== id);
      setStudents(updatedStudents);
      setTranscripts(updatedTranscripts);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      showNotification('Student and related grades deleted successfully');
    } else if (type === 'course') {
      const target = courses.find(c => c.courseId === id);
      const updatedCourses = courses.filter(c => c.courseId !== id);
      const updatedTranscripts = transcripts.filter(
        t => t.courseId !== id && t.courseCode !== target?.code
      );
      setCourses(updatedCourses);
      setTranscripts(updatedTranscripts);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      showNotification('Course and related grades deleted successfully');
    } else if (type === 'grade') {
      const updated = transcripts.filter((_, idx) => idx !== id);
      setTranscripts(updated);
      localStorage.setItem('transcripts', JSON.stringify(updated));
      showNotification('Grade deleted successfully');
    } else if (type === 'all') {
      setStudents([]);
      setCourses([]);
      setTranscripts([]);
      localStorage.removeItem('students');
      localStorage.removeItem('courses');
      localStorage.removeItem('transcripts');
      showNotification('All data cleared successfully');
    }
    setDeleteConfirm({ show: false, type: '', id: '', message: '' });
  };

  const hideIfNot = (tab) => (activeTab === tab ? '' : 'hidden');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Notification notification={notification} />

      <ConfirmDialog
        deleteConfirm={deleteConfirm}
        onCancel={() => setDeleteConfirm({ show: false, type: '', id: '', message: '' })}
        onConfirm={confirmDelete}
      />

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" />
            Grade Prediction System
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs activeTab={activeTab} onChange={setActiveTab} />

        <div className={hideIfNot('predict')}>
          <PredictionTab
            courses={courses}
            transcripts={transcripts}
            showNotification={showNotification}
          />
        </div>

        <div className={hideIfNot('students')}>
          <StudentsTab
            students={students}
            onCsvUpload={(file) => handleCsvUpload(file, 'students')}
            onAddStudent={addStudent}
            onDeleteStudent={deleteStudentAsk}
          />
        </div>

        <div className={hideIfNot('courses')}>
          <CoursesTab
            courses={courses}
            onCsvUpload={(file) => handleCsvUpload(file, 'courses')}
            onAddCourse={addCourse}
            onDeleteCourse={deleteCourseAsk}
          />
        </div>

        <div className={hideIfNot('grades')}>
          <GradesTab
            transcripts={transcripts}
            courses={courses}
            onCsvUpload={(file) => handleCsvUpload(file, 'transcripts')}
            onAddGrade={addGrade}
            onDeleteGrade={deleteGradeAsk}
          />
        </div>

        <div className={hideIfNot('data')}>
          <DataTab
            students={students}
            courses={courses}
            transcripts={transcripts}
            onClearAll={clearAllDataAsk}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
