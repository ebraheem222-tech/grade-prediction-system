import React, { useState } from 'react';
import { Plus, X, Search, Settings, Info } from 'lucide-react';
import { predictLocally } from '../../utils/knnLocal';
import { postPredict } from '../../services/api';

export default function PredictionTab({ courses, transcripts, showNotification }) {
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [targetCourse, setTargetCourse] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [knnConfig, setKnnConfig] = useState({ k: 7, minCommonCourses: 2 });

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
    setSelectedGrades(prev => [{ courseCode, courseId: course?.courseId || null, grade }, ...prev]);

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

    const filtered = selectedGrades.filter(
      g => (g.courseCode || '').trim().toUpperCase() !== target
    );

    if (filtered.length < 1) {
      showNotification('Add at least 1 course (not the target) to predict', 'error');
      return;
    }

    const targetCourseObj = courses.find(c => (c.code || '').trim().toUpperCase() === target);
    const targetCourseId = targetCourseObj?.courseId || target;

    setIsLoading(true);
    try {
      const local = predictLocally(filtered, targetCourseId, transcripts, knnConfig.k, knnConfig.minCommonCourses);
      if (local && local.neighbors.length > 0) {
        setPrediction({
          targetCourse: { code: target, id: targetCourseId },
          predictedGrade: local.predictedGrade,
          confidence: local.confidence,
          k: local.k,
          neighbors: local.neighbors,
          source: 'local',
        });
        showNotification('Prediction completed using local data');
        return;
      }

      const payloadGrades = filtered.map(g => ({
        courseCode: g.courseCode,
        courseId: g.courseId,
        grade: g.grade
      }));
      const data = await postPredict({
        studentGrades: payloadGrades,
        targetCourseCode: target,
        targetCourseId: targetCourseId,
        k: knnConfig.k,
        minCommonCourses: knnConfig.minCommonCourses
      });
      setPrediction({ ...data, source: 'backend' });
      showNotification('Prediction completed using backend data');
    } catch (e) {
      setPrediction(null);
      showNotification(`Prediction failed: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              <div className="text-sm opacity-90">Predicted Grade for {prediction.targetCourse?.code}</div>
              <div className="text-3xl font-bold">{prediction.predictedGrade}%</div>
              <div className="text-sm opacity-90 mt-1">Confidence: {prediction.confidence}%</div>
              <div className="text-xs opacity-75 mt-1">Source: {prediction.source === 'local' ? 'Manual Data' : 'Backend Data'}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="font-semibold text-gray-700 mb-1">Algorithm Settings Used:</div>
              <div className="text-gray-600">
                • K-Value: {prediction.k} neighbors found<br/>
                • Min Common Courses: {knnConfig.minCommonCourses}<br/>
                • Similarity Method: Cosine Similarity
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Similar Students ({prediction.k})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prediction.neighbors.map((n, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between">
                      <span>Student: {n.studentId}</span>
                      <span className="font-semibold">{n.theirGrade}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Similarity: {(n.similarity * 100).toFixed(1)}% | Common courses: {n.overlap}
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
  );
}
