// App.jsx
import React, { useState, useEffect } from 'react';
import {
  Upload, Plus, X, Search, FileText, Users, BookOpen, TrendingUp,
  AlertCircle, Check, Settings, Info, Trash2, AlertTriangle
} from 'lucide-react';
import Papa from 'papaparse';
import './index.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [activeTab, setActiveTab] = useState('predict');
  const [notification, setNotification] = useState(null);

  // Prediction state
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [targetCourse, setTargetCourse] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // KNN Configuration
  const [knnConfig, setKnnConfig] = useState({
    k: 7,
    minCommonCourses: 2
  });

  // Form states
  const [newStudent, setNewStudent] = useState({
    studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: ''
  });
  const [newCourse, setNewCourse] = useState({
    courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: ''
  });
  const [newGrade, setNewGrade] = useState({
    studentId: '', courseId: '', courseCode: '', grade: '', term: '', year: '', attemptNo: '1'
  });

  // Confirmation dialog state
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

  // Delete functions
  const deleteStudent = (studentId) => {
    setDeleteConfirm({
      show: true,
      type: 'student',
      id: studentId,
      message: `Are you sure you want to delete student ${studentId}? This will also delete all their grades.`
    });
  };

  const deleteCourse = (courseId) => {
    setDeleteConfirm({
      show: true,
      type: 'course',
      id: courseId,
      message: `Are you sure you want to delete course ${courseId}? This will also delete all grades for this course.`
    });
  };

  const deleteGrade = (index) => {
    const grade = transcripts[index];
    setDeleteConfirm({
      show: true,
      type: 'grade',
      id: index,
      message: `Are you sure you want to delete this grade record (${grade.studentId} - ${grade.courseId || grade.courseCode})?`
    });
  };

  const clearAllData = () => {
    setDeleteConfirm({
      show: true,
      type: 'all',
      id: '',
      message: 'Are you sure you want to delete ALL data? This action cannot be undone!'
    });
  };

  const confirmDelete = () => {
    const { type, id } = deleteConfirm;

    switch (type) {
      case 'student': {
        const updatedStudents = students.filter(s => s.studentId !== id);
        const updatedTranscriptsAfterStudent = transcripts.filter(t => t.studentId !== id);
        setStudents(updatedStudents);
        setTranscripts(updatedTranscriptsAfterStudent);
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        localStorage.setItem('transcripts', JSON.stringify(updatedTranscriptsAfterStudent));
        showNotification('Student and related grades deleted successfully');
        break;
      }
      case 'course': {
        const updatedCourses = courses.filter(c => c.courseId !== id);
        const updatedTranscriptsAfterCourse = transcripts.filter(t => t.courseId !== id && t.courseCode !== courses.find(c => c.courseId === id)?.code);
        setCourses(updatedCourses);
        setTranscripts(updatedTranscriptsAfterCourse);
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        localStorage.setItem('transcripts', JSON.stringify(updatedTranscriptsAfterCourse));
        showNotification('Course and related grades deleted successfully');
        break;
      }
      case 'grade': {
        const updatedGrades = transcripts.filter((_, index) => index !== id);
        setTranscripts(updatedGrades);
        localStorage.setItem('transcripts', JSON.stringify(updatedGrades));
        showNotification('Grade deleted successfully');
        break;
      }
      case 'all':
        setStudents([]);
        setCourses([]);
        setTranscripts([]);
        setSelectedGrades([]);
        setPrediction(null);
        localStorage.removeItem('students');
        localStorage.removeItem('courses');
        localStorage.removeItem('transcripts');
        showNotification('All data cleared successfully');
        break;
    }

    setDeleteConfirm({ show: false, type: '', id: '', message: '' });
  };

  // CSV Upload Handlers
  const handleCsvUpload = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        switch (type) {
          case 'students': {
            const merged = [...students, ...results.data];
            setStudents(merged);
            localStorage.setItem('students', JSON.stringify(merged));
            showNotification(`Uploaded ${results.data.length} students`);
            break;
          }
          case 'courses': {
            const merged = [...courses, ...results.data];
            setCourses(merged);
            localStorage.setItem('courses', JSON.stringify(merged));
            showNotification(`Uploaded ${results.data.length} courses`);
            break;
          }
          case 'transcripts': {
            const merged = [...transcripts, ...results.data];
            setTranscripts(merged);
            localStorage.setItem('transcripts', JSON.stringify(merged));
            showNotification(`Uploaded ${results.data.length} transcript records`);
            break;
          }
        }
      },
      error: (error) => {
        showNotification(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    const savedCourses = localStorage.getItem('courses');
    const savedTranscripts = localStorage.getItem('transcripts');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedCourses) setCourses(JSON.parse(savedCourses));
    if (savedTranscripts) setTranscripts(JSON.parse(savedTranscripts));
  }, []);

  // Manual Add Handlers
  const addStudent = () => {
    if (!newStudent.studentId || !newStudent.firstName || !newStudent.lastName) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const updatedStudents = [...students, { ...newStudent }];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    setNewStudent({ studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: '' });
    showNotification('Student added successfully');
  };

  const addCourse = () => {
    if (!newCourse.courseId || !newCourse.code || !newCourse.name) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    const updatedCourses = [...courses, { ...newCourse }];
    setCourses(updatedCourses);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
    setNewCourse({ courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: '' });
    showNotification('Course added successfully');
  };

  const addGrade = () => {
    if (!newGrade.studentId || (!newGrade.courseId && !newGrade.courseCode) || !newGrade.grade) {
      showNotification('Please fill in required fields', 'error');
      return;
    }

    // If courseCode is provided but not courseId, try to find the courseId
    let finalGrade = { ...newGrade };
    if (newGrade.courseCode && !newGrade.courseId) {
      const course = courses.find(c =>
        (c.code || '').trim().toUpperCase() === (newGrade.courseCode || '').trim().toUpperCase()
      );
      if (course) {
        finalGrade.courseId = course.courseId;
      }
    }

    const updatedTranscripts = [...transcripts, finalGrade];
    setTranscripts(updatedTranscripts);
    localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
    setNewGrade({ studentId: '', courseId: '', courseCode: '', grade: '', term: '', year: '', attemptNo: '1' });
    showNotification('Grade added successfully');
  };

  // Build student vectors from manual data for local prediction
  const buildLocalStudentVectors = () => {
    const vectors = {};
    const takersMap = {};

    transcripts.forEach(transcript => {
      const studentId = transcript.studentId;
      const courseId = transcript.courseId || transcript.courseCode;
      const grade = parseFloat(transcript.grade);
      if (!studentId || !courseId || isNaN(grade)) return;

      if (!vectors[studentId]) vectors[studentId] = {};
      vectors[studentId][courseId] = grade / 100;

      if (!takersMap[courseId]) takersMap[courseId] = new Set();
      takersMap[courseId].add(studentId);
    });

    return { vectors, takers: takersMap };
  };

  // Cosine similarity
  const cosineSimilarity = (vecA, vecB) => {
    let dot = 0, normA = 0, normB = 0, overlap = 0;

    for (const key in vecA) {
      if (key in vecB) {
        dot += vecA[key] * vecB[key];
        overlap++;
      }
      normA += vecA[key] * vecA[key];
    }
    for (const key in vecB) normB += vecB[key] * vecB[key];

    const similarity = (normA && normB) ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    return { similarity, overlap };
  };

  // Local KNN prediction
  const predictLocally = (studentGrades, targetCourseId, k, minCommon) => {
    const { vectors, takers } = buildLocalStudentVectors();

    // Build query vector
    const queryVector = {};
    studentGrades.forEach(grade => {
      const courseId = grade.courseId || grade.courseCode;
      if (courseId) queryVector[courseId] = grade.grade / 100;
    });

    // Find neighbors
    const neighbors = [];
    const courseTakers = takers[targetCourseId];
    if (!courseTakers || courseTakers.size === 0) return null;

    courseTakers.forEach(studentId => {
      const studentVector = vectors[studentId];
      if (!studentVector || !studentVector[targetCourseId]) return;

      const { similarity, overlap } = cosineSimilarity(queryVector, studentVector);
      if (overlap >= minCommon && similarity > 0) {
        neighbors.push({
          studentId,
          similarity,
          overlap,
          grade: studentVector[targetCourseId] * 100
        });
      }
    });

    neighbors.sort((a, b) => b.similarity - a.similarity);
    const topNeighbors = neighbors.slice(0, k);
    if (topNeighbors.length === 0) return null;

    // Weighted average
    let weightedSum = 0;
    let weightTotal = 0;
    topNeighbors.forEach(n => {
      weightedSum += n.grade * n.similarity;
      weightTotal += n.similarity;
    });

    const predictedGrade = weightTotal > 0 ? weightedSum / weightTotal : null;
    const confidence = Math.min(
      100,
      (topNeighbors.length / k) * 60 +
      (topNeighbors.reduce((sum, n) => sum + n.similarity, 0) / topNeighbors.length) * 40
    );

    return {
      predictedGrade: predictedGrade ? Math.round(predictedGrade * 10) / 10 : null,
      neighbors: topNeighbors.map(n => ({
        studentId: n.studentId,
        similarity: Math.round(n.similarity * 1000) / 1000,
        overlap: n.overlap,
        theirGrade: Math.round(n.grade * 10) / 10
      })),
      confidence: Math.round(confidence),
      k: topNeighbors.length
    };
  };

  // Prediction Handlers
  const addGradeForPrediction = () => {
    const rawCode = document.getElementById('gradeCourseCode').value;
    const gradeStr = document.getElementById('gradeValue').value;

    const courseCode = (rawCode || '').trim().toUpperCase();
    const grade = Number(gradeStr);

    if (!courseCode || Number.isNaN(grade) || grade < 0 || grade > 100) {
      showNotification('Please enter a valid course code and grade (0-100)', 'error');
      return;
    }
    if (courseCode === (targetCourse || '').trim().toUpperCase()) {
      showNotification('Target course cannot be included in history', 'error');
      return;
    }
    if (selectedGrades.some(g => (g.courseCode || '').toUpperCase() === courseCode)) {
      showNotification('You already added this course', 'error');
      return;
    }

    const course = courses.find(c => (c.code || '').trim().toUpperCase() === courseCode);

    setSelectedGrades(prev => [{
      courseCode,
      courseId: course?.courseId || null,
      grade
    }, ...prev]);

    document.getElementById('gradeCourseCode').value = '';
    document.getElementById('gradeValue').value = '';
  };

  const removeGrade = (index) => {
    setSelectedGrades(selectedGrades.filter((_, i) => i !== index));
  };

  const predictGrade = async () => {
    const target = (targetCourse || '').trim().toUpperCase();
    if (!target) {
      showNotification('Please select a target course', 'error');
      return;
    }

    // Filter out target course from history
    const filtered = selectedGrades.filter(
      g => (g.courseCode || '').trim().toUpperCase() !== target
    );
    if (filtered.length < 1) {
      showNotification('Add at least 1 course (not the target) to predict', 'error');
      return;
    }

    const targetCourseObj = courses.find(
      c => (c.code || '').trim().toUpperCase() === target
    );
    const targetCourseId = targetCourseObj?.courseId || target;

    setIsLoading(true);
    try {
      // Try local prediction first
      const localResult = predictLocally(filtered, targetCourseId, knnConfig.k, knnConfig.minCommonCourses);
      if (localResult && localResult.neighbors.length > 0) {
        setPrediction({
          targetCourse: { code: target, id: targetCourseId },
          predictedGrade: localResult.predictedGrade,
          confidence: localResult.confidence,
          k: localResult.k,
          neighbors: localResult.neighbors,
          source: 'local'
        });
        showNotification('Prediction completed using local data');
      } else {
        // Backend fallback
        const payloadGrades = filtered.map(g => ({
          courseCode: g.courseCode,
          courseId: g.courseId,
          grade: g.grade
        }));

        const res = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentGrades: payloadGrades,
            targetCourseCode: target,
            targetCourseId: targetCourseId,
            k: knnConfig.k,
            minCommonCourses: knnConfig.minCommonCourses
          })
        });

        if (!res.ok) {
          throw new Error('No data available for prediction');
        } else {
          const data = await res.json();
          setPrediction({ ...data, source: 'backend' });
          showNotification('Prediction completed using backend data');
        }
      }
    } catch (e) {
      showNotification(`Prediction failed: ${e.message}`, 'error');
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: expose data globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__courses = courses;
      window.__transcripts = transcripts;
      window.__students = students;
    }
  }, [courses, transcripts, students]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-bold">Confirm Delete</h3>
            </div>
            <p className="text-gray-700 mb-6">{deleteConfirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ show: false, type: '', id: '', message: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" />
            Grade Prediction System
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {['predict', 'students', 'courses', 'grades', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ---------- TABS (always mounted; toggled via hidden/block) ---------- */}

        {/* Prediction Tab */}
        <div className={activeTab === 'predict' ? 'block' : 'hidden'}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="text-indigo-600" />
                Grade Prediction
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Grades
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    id="gradeCourseCode"
                    type="text"
                    placeholder="Course Code (e.g., CS101)"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    id="gradeValue"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Grade"
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addGradeForPrediction}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span>{grade.courseCode}: {grade.grade}%</span>
                      <button
                        onClick={() => removeGrade(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Course
                </label>
                <input
                  type="text"
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  placeholder="Enter target course code"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* KNN Configuration */}
              <div className="mb-4 border-t pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 hover:text-indigo-600"
                >
                  <Settings size={16} />
                  Advanced Configuration
                  <span className="text-xs text-gray-500">
                    ({showAdvanced ? 'Hide' : 'Show'})
                  </span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        K-Nearest Neighbors
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
                            Number of similar students to consider. Higher values give more stable predictions.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={knnConfig.k}
                        onChange={(e) => setKnnConfig({ ...knnConfig, k: parseInt(e.target.value) || 7 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-500">Recommended: 5-10</span>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        Minimum Common Courses
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
                            Minimum courses in common with similar students.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={knnConfig.minCommonCourses}
                        onChange={(e) => setKnnConfig({ ...knnConfig, minCommonCourses: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-500">Recommended: 2-3</span>
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Current Settings:</strong> Will find up to {knnConfig.k} similar students
                        who have at least {knnConfig.minCommonCourses} courses in common.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={predictGrade}
                disabled={isLoading}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Predicting...' : 'Predict Grade'}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Prediction Results</h2>
              {prediction ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-lg">
                    <div className="text-sm opacity-90">Predicted Grade for {prediction.targetCourse.code}</div>
                    <div className="text-3xl font-bold">{prediction.predictedGrade}%</div>
                    <div className="text-sm opacity-90 mt-1">Confidence: {prediction.confidence}%</div>
                    <div className="text-xs opacity-75 mt-1">Source: {prediction.source === 'local' ? 'Manual Data' : 'Backend Data'}</div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="font-semibold text-gray-700 mb-1">Algorithm Settings Used:</div>
                    <div className="text-gray-600">
                      • K-Value: {prediction.k} neighbors found<br />
                      • Min Common Courses: {knnConfig.minCommonCourses}<br />
                      • Similarity Method: Cosine Similarity
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Similar Students ({prediction.k})</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {prediction.neighbors.map((neighbor, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Student: {neighbor.studentId}</span>
                            <span className="font-semibold">{neighbor.theirGrade}%</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Similarity: {(neighbor.similarity * 100).toFixed(1)}% |
                            Common courses: {neighbor.overlap}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <div className="mb-4">
                    <Search size={48} className="mx-auto text-gray-300" />
                  </div>
                  <p className="mb-2">No prediction yet</p>
                  <p className="text-sm">Add grades and select a target course to get started</p>

                  <div className="mt-6 text-left bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Quick Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Add at least 2 course grades for better accuracy</li>
                      <li>• Upload CSV data or add manual entries</li>
                      <li>• Adjust K value in advanced settings</li>
                      <li>• Higher confidence = more reliable prediction</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Students Tab */}
        <div className={activeTab === 'students' ? 'block' : 'hidden'}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Manage Students
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Students CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files[0] && handleCsvUpload(e.target.files[0], 'students')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Student ID*"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="First Name*"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Last Name*"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Program"
                value={newStudent.program}
                onChange={(e) => setNewStudent({ ...newStudent, program: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Start Year"
                value={newStudent.startYear}
                onChange={(e) => setNewStudent({ ...newStudent, startYear: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addStudent}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Student
            </button>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Students ({students.length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Program</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 50).map((student, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{student.studentId}</td>
                        <td className="px-3 py-2">{student.firstName} {student.lastName}</td>
                        <td className="px-3 py-2">{student.email}</td>
                        <td className="px-3 py-2">{student.program}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => deleteStudent(student.studentId)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length > 50 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {students.length - 50} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Courses Tab */}
        <div className={activeTab === 'courses' ? 'block' : 'hidden'}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              Manage Courses
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Courses CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files[0] && handleCsvUpload(e.target.files[0], 'courses')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Course ID*"
                value={newCourse.courseId}
                onChange={(e) => setNewCourse({ ...newCourse, courseId: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course Code*"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course Name*"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Credits"
                value={newCourse.credits}
                onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newCourse.type}
                onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Type</option>
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
                <option value="Lab">Lab</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={newCourse.department}
                onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Level</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
              </select>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                placeholder="Difficulty (1-10)"
                value={newCourse.difficulty}
                onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addCourse}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Course
            </button>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Courses ({courses.length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Credits</th>
                      <th className="px-3 py-2 text-left">Department</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 50).map((course, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{course.courseId}</td>
                        <td className="px-3 py-2 font-semibold">{course.code}</td>
                        <td className="px-3 py-2">{course.name}</td>
                        <td className="px-3 py-2">{course.credits}</td>
                        <td className="px-3 py-2">{course.department}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => deleteCourse(course.courseId)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete course"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {courses.length > 50 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {courses.length - 50} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grades Tab */}
        <div className={activeTab === 'grades' ? 'block' : 'hidden'}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Manage Grades
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Transcripts CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files[0] && handleCsvUpload(e.target.files[0], 'transcripts')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Student ID*"
                value={newGrade.studentId}
                onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course ID or Code*"
                value={newGrade.courseId || newGrade.courseCode}
                onChange={(e) => {
                  const value = e.target.value;
                  const course = courses.find(c =>
                    (c.code || '').trim().toUpperCase() === value.trim().toUpperCase()
                  );
                  if (course) {
                    setNewGrade({ ...newGrade, courseId: course.courseId, courseCode: course.code });
                  } else {
                    setNewGrade({ ...newGrade, courseId: value, courseCode: value });
                  }
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Grade (0-100)*"
                value={newGrade.grade}
                onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newGrade.term}
                onChange={(e) => setNewGrade({ ...newGrade, term: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Term</option>
                <option value="Winter">Winter</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
              <input
                type="number"
                placeholder="Year"
                value={newGrade.year}
                onChange={(e) => setNewGrade({ ...newGrade, year: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min="1"
                placeholder="Attempt #"
                value={newGrade.attemptNo}
                onChange={(e) => setNewGrade({ ...newGrade, attemptNo: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addGrade}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Grade
            </button>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Transcript Records ({transcripts.length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-left">Course</th>
                      <th className="px-3 py-2 text-left">Grade</th>
                      <th className="px-3 py-2 text-left">Term</th>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transcripts.slice(0, 50).map((grade, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{grade.studentId}</td>
                        <td className="px-3 py-2">{grade.courseId || grade.courseCode}</td>
                        <td className="px-3 py-2">{grade.grade}%</td>
                        <td className="px-3 py-2">{grade.term}</td>
                        <td className="px-3 py-2">{grade.year}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => deleteGrade(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete grade"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transcripts.length > 50 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {transcripts.length - 50} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary Tab */}
        <div className={activeTab === 'data' ? 'block' : 'hidden'}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Students</h3>
                <Users className="text-indigo-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-indigo-600">{students.length}</div>
              <div className="text-sm text-gray-600 mt-2">Total registered students</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Courses</h3>
                <BookOpen className="text-green-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-green-600">{courses.length}</div>
              <div className="text-sm text-gray-600 mt-2">Available courses</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Grades</h3>
                <FileText className="text-purple-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-purple-600">{transcripts.length}</div>
              <div className="text-sm text-gray-600 mt-2">Transcript records</div>
            </div>

            <div className="md:col-span-3 bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Data Management</h3>

              {/* Export Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Export Data</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const csv = Papa.unparse(students);
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'students.csv';
                      a.click();
                    }}
                    className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Export Students CSV
                  </button>
                  <button
                    onClick={() => {
                      const csv = Papa.unparse(courses);
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'courses.csv';
                      a.click();
                    }}
                    className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Export Courses CSV
                  </button>
                  <button
                    onClick={() => {
                      const csv = Papa.unparse(transcripts);
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'transcripts.csv';
                      a.click();
                    }}
                    className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Export Transcripts CSV
                  </button>
                </div>
              </div>

              {/* Clear Data Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-700 mb-3">Danger Zone</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-800">Clear All Data</p>
                      <p className="text-xs text-red-600 mt-1">
                        This will permanently delete all students, courses, and grades. Export your data first!
                      </p>
                    </div>
                    <button
                      onClick={clearAllData}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> All data is stored locally in your browser.
                  Manually added data will persist across sessions. Export regularly to backup your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- END TABS ---------- */}
      </div>
    </div>
  );
}

export default App;
