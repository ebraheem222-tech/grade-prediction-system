import React, { useState,useEffect } from 'react';
import { Upload, Plus, X, Search, FileText, Users, BookOpen, TrendingUp, AlertCircle, Check } from 'lucide-react';
import Papa from 'papaparse';
import './index.css'

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

  // Form states
  const [newStudent, setNewStudent] = useState({
    studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: ''
  });
  const [newCourse, setNewCourse] = useState({
    courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: ''
  });
  const [newGrade, setNewGrade] = useState({
    studentId: '', courseId: '', grade: '', term: '', year: '', attemptNo: '1'
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // CSV Upload Handlers
  const handleCsvUpload = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        switch(type) {
          case 'students':
            setStudents(prev => [...prev, ...results.data]);
            showNotification(`Uploaded ${results.data.length} students`);
            break;
          case 'courses':
            setCourses(prev => [...prev, ...results.data]);
            showNotification(`Uploaded ${results.data.length} courses`);
            break;
          case 'transcripts':
            setTranscripts(prev => [...prev, ...results.data]);
            showNotification(`Uploaded ${results.data.length} transcript records`);
            break;
        }
      },
      error: (error) => {
        showNotification(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  // Manual Add Handlers
  const addStudent = () => {
    if (!newStudent.studentId || !newStudent.firstName || !newStudent.lastName) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    setStudents([...students, { ...newStudent }]);
    setNewStudent({ studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: '' });
    showNotification('Student added successfully');
  };

  const addCourse = () => {
    if (!newCourse.courseId || !newCourse.code || !newCourse.name) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    setCourses([...courses, { ...newCourse }]);
    setNewCourse({ courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: '' });
    showNotification('Course added successfully');
  };

  const addGrade = () => {
    if (!newGrade.studentId || !newGrade.courseId || !newGrade.grade) {
      showNotification('Please fill in required fields', 'error');
      return;
    }
    setTranscripts([...transcripts, { ...newGrade }]);
    setNewGrade({ studentId: '', courseId: '', grade: '', term: '', year: '', attemptNo: '1' });
    showNotification('Grade added successfully');
  };

  // Prediction Handlers
  const addGradeForPrediction = () => {
  const rawCode = document.getElementById('gradeCourseCode').value;
  const gradeStr = document.getElementById('gradeValue').value;

  const courseCode = (rawCode || '').trim().toUpperCase();
  const grade = Number(gradeStr);

  if (!courseCode || Number.isNaN(grade)) {
    showNotification('Please enter a valid course code and numeric grade', 'error');
    return;
  }
  if (courseCode === (targetCourse || '').trim().toUpperCase()) {
    showNotification('Target course cannot be included in history', 'error');
    return;
  }
  if (selectedGrades.some(g => g.courseCode.toUpperCase() === courseCode)) {
    showNotification('You already added this course. Edit it instead.', 'error');
    return;
  }
  setSelectedGrades(prev => [{ courseCode, grade },...prev]);
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

  // Ignore any history rows that match the target course (case-insensitive)
  const filtered = selectedGrades.filter(
    g => (g.courseCode || '').trim().toUpperCase() !== target
  );

  // Require at least 1 prior distinct course (easier for testing; bump to 2 later)
  const distinctCount = new Set(filtered.map(g => (g.courseCode || '').trim().toUpperCase())).size;
  if (distinctCount < 1) {
    showNotification('Add at least 1 course (not the target) to predict', 'error');
    return;
  }
    

  // Enrich with courseId if available
  const payloadGrades = filtered.map(g => {
    const code = (g.courseCode || '').trim().toUpperCase();
    const course = courses.find(c => (c.code || '').trim().toUpperCase() === code);
    console.log(course);
    return {
      code,
      courseCode: code,
      courseId: course?.courseId ?? null,
      grade: Number(g.grade),
    };
  });

  const targetCourseObj = courses.find(
    c => (c.code || '').trim().toUpperCase() === target
  );

  setIsLoading(true);
  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentGrades: payloadGrades,
        targetCourseCode: target,
        targetCourseId: targetCourseObj?.courseId ?? null,
        k: 3,                 // start small for testing
        minCommonCourses: 1,  // relax for small datasets
      }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

    const data = JSON.parse(text);
    // Optional: let the user know we ignored target from history
    if (filtered.length !== selectedGrades.length) {
      showNotification(`Ignored ${target} from history while predicting`, 'success');
    } else {
      showNotification('Prediction completed successfully');
    }
    setPrediction(data);
  } catch (e) {
    showNotification(`Prediction failed: ${e.message}`, 'error');
    setPrediction(null);
  } finally {
    setIsLoading(false);
  }
};


useEffect(() => {
  if (typeof window !== 'undefined') {
    window.__courses = courses;
    window.__transcripts = transcripts;
    window.__students = students;
  }
}, [courses, transcripts, students]);
useEffect(()=>{
    console.log(selectedGrades);

},[selectedGrades])

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

        {/* Prediction Tab */}
        {activeTab === 'predict' && (
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
                  No prediction yet. Add grades and select a target course.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Manage Students
            </h2>
            
            {/* CSV Upload */}
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

            {/* Manual Add Form */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Student ID*"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="First Name*"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Last Name*"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Program"
                value={newStudent.program}
                onChange={(e) => setNewStudent({...newStudent, program: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Start Year"
                value={newStudent.startYear}
                onChange={(e) => setNewStudent({...newStudent, startYear: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addStudent}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Student
            </button>

            {/* Students List */}
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
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 10).map((student, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{student.studentId}</td>
                        <td className="px-3 py-2">{student.firstName} {student.lastName}</td>
                        <td className="px-3 py-2">{student.email}</td>
                        <td className="px-3 py-2">{student.program}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length > 10 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {students.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              Manage Courses
            </h2>
            
            {/* CSV Upload */}
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

            {/* Manual Add Form */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Course ID*"
                value={newCourse.courseId}
                onChange={(e) => setNewCourse({...newCourse, courseId: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course Code*"
                value={newCourse.code}
                onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course Name*"
                value={newCourse.name}
                onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Credits"
                value={newCourse.credits}
                onChange={(e) => setNewCourse({...newCourse, credits: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newCourse.type}
                onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
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
                onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
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
                onChange={(e) => setNewCourse({...newCourse, difficulty: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addCourse}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Course
            </button>

            {/* Courses List */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Courses ({courses.length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Credits</th>
                      <th className="px-3 py-2 text-left">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 10).map((course, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{course.code}</td>
                        <td className="px-3 py-2">{course.name}</td>
                        <td className="px-3 py-2">{course.credits}</td>
                        <td className="px-3 py-2">{course.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {courses.length > 10 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {courses.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Manage Grades
            </h2>
            
            {/* CSV Upload */}
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

            {/* Manual Add Form */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Student ID*"
                value={newGrade.studentId}
                onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Course ID*"
                value={newGrade.courseId}
                onChange={(e) => setNewGrade({...newGrade, courseId: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Grade (0-100)*"
                value={newGrade.grade}
                onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newGrade.term}
                onChange={(e) => setNewGrade({...newGrade, term: e.target.value})}
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
                onChange={(e) => setNewGrade({...newGrade, year: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min="1"
                placeholder="Attempt #"
                value={newGrade.attemptNo}
                onChange={(e) => setNewGrade({...newGrade, attemptNo: e.target.value})}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addGrade}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Grade
            </button>

            {/* Grades List */}
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
                    </tr>
                  </thead>
                  <tbody>
                    {transcripts.slice(0, 10).map((grade, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{grade.studentId}</td>
                        <td className="px-3 py-2">{grade.courseId}</td>
                        <td className="px-3 py-2">{grade.grade}%</td>
                        <td className="px-3 py-2">{grade.term}</td>
                        <td className="px-3 py-2">{grade.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transcripts.length > 10 && (
                  <div className="text-center text-gray-500 py-2">
                    ... and {transcripts.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Summary Tab */}
        {activeTab === 'data' && (
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
              <h3 className="font-bold text-lg mb-4">Export Data</h3>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;