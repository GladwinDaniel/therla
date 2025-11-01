import React, { useState, useEffect, useRef } from 'react';
import { Upload, Calendar, Sparkles, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Papa from 'papaparse';

interface CourseSlot {
  theory: string;
  tutorial: string;
  labs: string[];
  faculty: string;
  location: string;
  courseCode: string;
}

interface Course {
  name: string;
  slots: CourseSlot[];
}

interface Timetable {
  slots: (CourseSlot & { course: string })[];
  batchType: 'Morning' | 'Evening';
}

interface ScheduleSlot {
  day: string;
  time: string;
}

export const FFCSTimeTableGenerator = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [generatedTimetables, setGeneratedTimetables] = useState<Timetable[]>([]);
  const [preferMorning, setPreferMorning] = useState(true);
  const [activeTab, setActiveTab] = useState<'input' | 'select' | 'results'>('input');
  const [selectedTimetableIndex, setSelectedTimetableIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'morning' | 'evening'>('all');
  const [clashInfo, setClashInfo] = useState<{course1: string, course2: string, slot1: string, slot2: string}[]>([]);

  const morningTheorySlots = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'TB1', 'TC1', 'TD1', 'TE1', 'TF1', 'TG1', 'TAA1', 'TBB1', 'TCC1', 'TDD1', 'TA1'];
  const afternoonLabSlots = ['L31', 'L32', 'L33', 'L34', 'L35', 'L36', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42', 'L43', 'L44', 'L45', 'L46', 'L47', 'L48', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60'];

  const slotToSchedule: Record<string, ScheduleSlot[]> = {
    'A1': [{ day: 'MON', time: '08:00-08:50' }, { day: 'WED', time: '08:00-08:50' }, { day: 'FRI', time: '08:00-08:50' }],
    'F1': [{ day: 'MON', time: '08:55-09:45' }, { day: 'WED', time: '08:55-09:45' }],
    'D1': [{ day: 'MON', time: '09:50-10:40' }, { day: 'WED', time: '09:50-10:40' }],
    'TB1': [{ day: 'MON', time: '10:45-11:35' }],
    'TG1': [{ day: 'MON', time: '11:40-12:30' }],
    'B1': [{ day: 'TUE', time: '08:00-08:50' }, { day: 'THU', time: '08:00-08:50' }],
    'G1': [{ day: 'TUE', time: '08:55-09:45' }, { day: 'THU', time: '08:55-09:45' }],
    'E1': [{ day: 'TUE', time: '09:50-10:40' }, { day: 'THU', time: '09:50-10:40' }],
    'TC1': [{ day: 'TUE', time: '10:45-11:35' }],
    'TAA1': [{ day: 'TUE', time: '11:40-12:30' }],
    'C1': [{ day: 'WED', time: '09:50-10:40' }],
    'TBB1': [{ day: 'WED', time: '11:40-12:30' }],
    'TE1': [{ day: 'THU', time: '10:45-11:35' }],
    'TCC1': [{ day: 'THU', time: '11:40-12:30' }],
    'TA1': [{ day: 'FRI', time: '08:55-09:45' }],
    'TDD1': [{ day: 'FRI', time: '11:40-12:30' }],
    'A2': [{ day: 'MON', time: '14:00-14:50' }, { day: 'WED', time: '14:00-14:50' }, { day: 'FRI', time: '14:00-14:50' }],
    'F2': [{ day: 'MON', time: '14:55-15:45' }, { day: 'WED', time: '14:55-15:45' }],
    'D2': [{ day: 'MON', time: '15:50-16:40' }, { day: 'WED', time: '15:50-16:40' }],
    'TB2': [{ day: 'MON', time: '16:45-17:35' }],
    'TG2': [{ day: 'MON', time: '17:40-18:30' }],
    'B2': [{ day: 'TUE', time: '14:00-14:50' }, { day: 'THU', time: '14:00-14:50' }],
    'G2': [{ day: 'TUE', time: '14:55-15:45' }, { day: 'THU', time: '14:55-15:45' }],
    'E2': [{ day: 'TUE', time: '15:50-16:40' }, { day: 'THU', time: '15:50-16:40' }],
    'TC2': [{ day: 'TUE', time: '16:45-17:35' }],
    'TAA2': [{ day: 'TUE', time: '17:40-18:30' }],
    'C2': [{ day: 'WED', time: '14:55-15:45' }],
    'TBB2': [{ day: 'WED', time: '17:40-18:30' }],
    'TE2': [{ day: 'THU', time: '16:45-17:35' }],
    'TCC2': [{ day: 'THU', time: '17:40-18:30' }],
    'TA2': [{ day: 'FRI', time: '15:50-16:40' }],
    'TF2': [{ day: 'FRI', time: '16:45-17:35' }],
    'TDD2': [{ day: 'FRI', time: '17:40-18:30' }]
  };

// import React from 'react'; // already imported at the top of the file

  const filePathRef = useRef<HTMLInputElement>(null);


  const handleFilePathInput = () => {
    const filePath = filePathRef.current?.value || '/c:/Users/goldw/Documents/trae_projects/summapnna/ffcs_timetable_cleaned.csv';
    if (!filePath) return;
    
    fetch(filePath)
      .then(response => response.text())
      .then(csvData => {
        Papa.parse(csvData, {
          header: true,
          complete: (results) => {
            const courseMap = new Map<string, Course>();

            results.data.forEach((row: any) => {
              if (!row['Course title'] || row['Course title'].trim() === '') return;

              const courseName = row['Course title'].trim();
              const choice1 = row['choice 1']?.trim() || '';
              const choice2 = row['choice2']?.trim() || '';
              const choice3 = row['choice3']?.trim() || '';

              if (!courseMap.has(courseName)) {
                courseMap.set(courseName, { name: courseName, slots: [] });
              }

              const course = courseMap.get(courseName)!;

              // Process choice 1
              if (choice1) {
                const colonIndex = choice1.indexOf(':');
                let slotInfo = choice1;
                let faculty = 'Faculty';

                if (colonIndex !== -1) {
                  slotInfo = choice1.substring(0, colonIndex);
                  faculty = choice1.substring(colonIndex + 1);
                }

                const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
                const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
                const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
                const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

                course.slots.push({
                  theory: theorySlot,
                  tutorial: tutorialSlot,
                  labs: labSlots,
                  faculty: faculty,
                  location: 'Choice 1',
                  courseCode: theorySlot
                });
              }

              // Process choice 2
              if (choice2) {
                const colonIndex = choice2.indexOf(':');
                let slotInfo = choice2;
                let faculty = 'Faculty';

                if (colonIndex !== -1) {
                  slotInfo = choice2.substring(0, colonIndex);
                  faculty = choice2.substring(colonIndex + 1);
                }

                const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
                const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
                const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
                const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

                course.slots.push({
                  theory: theorySlot,
                  tutorial: tutorialSlot,
                  labs: labSlots,
                  faculty: faculty,
                  location: 'Choice 2',
                  courseCode: theorySlot
                });
              }

              // Process choice 3
              if (choice3) {
                const colonIndex = choice3.indexOf(':');
                let slotInfo = choice3;
                let faculty = 'Faculty';

                if (colonIndex !== -1) {
                  slotInfo = choice3.substring(0, colonIndex);
                  faculty = choice3.substring(colonIndex + 1);
                }

                const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
                const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
                const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
                const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

                course.slots.push({
                  theory: theorySlot,
                  tutorial: tutorialSlot,
                  labs: labSlots,
                  faculty: faculty,
                  location: 'Choice 3',
                  courseCode: theorySlot
                });
              }
            });

            const coursesArray = Array.from(courseMap.values()).filter(c => c.slots.length > 0);
            setCourses(coursesArray);
            setActiveTab('select');
          }
        });
      })
      .catch(error => {
        console.error('Error fetching CSV:', error);
        alert('Error loading CSV file. Please check the file path.');
      });
  };

  useEffect(() => {
    // Set default file path
    if (filePathRef.current) {
      filePathRef.current.value = '/c:/Users/goldw/Documents/trae_projects/summapnna/ffcs_timetable_cleaned.csv';
      handleFilePathInput();
    }
  }, []);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const courseMap = new Map<string, Course>();

        results.data.forEach((row: any) => {
          if (!row['Course title'] || row['Course title'].trim() === '') return;

          const courseName = row['Course title'].trim();
          const choice1 = row['choice 1']?.trim() || '';
          const choice2 = row['choice2']?.trim() || '';
          const choice3 = row['choice3']?.trim() || '';

          if (!courseMap.has(courseName)) {
            courseMap.set(courseName, { name: courseName, slots: [] });
          }

          const course = courseMap.get(courseName)!;

          // Process choice 1
          if (choice1) {
            const colonIndex = choice1.indexOf(':');
            let slotInfo = choice1;
            let faculty = 'Faculty';

            if (colonIndex !== -1) {
              slotInfo = choice1.substring(0, colonIndex);
              faculty = choice1.substring(colonIndex + 1);
            }

            const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
            const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
            const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
            const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

            course.slots.push({
              theory: theorySlot,
              tutorial: tutorialSlot,
              labs: labSlots,
              faculty: faculty,
              location: 'Choice 1',
              courseCode: theorySlot
            });
          }

          // Process choice 2
          if (choice2) {
            const colonIndex = choice2.indexOf(':');
            let slotInfo = choice2;
            let faculty = 'Faculty';

            if (colonIndex !== -1) {
              slotInfo = choice2.substring(0, colonIndex);
              faculty = choice2.substring(colonIndex + 1);
            }

            const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
            const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
            const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
            const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

            course.slots.push({
              theory: theorySlot,
              tutorial: tutorialSlot,
              labs: labSlots,
              faculty: faculty,
              location: 'Choice 2',
              courseCode: theorySlot
            });
          }

          // Process choice 3
          if (choice3) {
            const colonIndex = choice3.indexOf(':');
            let slotInfo = choice3;
            let faculty = 'Faculty';

            if (colonIndex !== -1) {
              slotInfo = choice3.substring(0, colonIndex);
              faculty = choice3.substring(colonIndex + 1);
            }

            const slotCodes = slotInfo.split('+').map((slot: string) => slot.trim());
            const theorySlot = slotCodes.find((slot: string) => !slot.startsWith('L')) || '';
            const tutorialSlot = slotCodes.find((slot: string) => slot.startsWith('T')) || '';
            const labSlots = slotCodes.filter((slot: string) => slot.startsWith('L'));

            course.slots.push({
              theory: theorySlot,
              tutorial: tutorialSlot,
              labs: labSlots,
              faculty: faculty,
              location: 'Choice 3',
              courseCode: theorySlot
            });
          }
        });

        const coursesArray = Array.from(courseMap.values()).filter(c => c.slots.length > 0);
        setCourses(coursesArray);
        setActiveTab('select');
      }
    });
  };

  const isMorningBatch = (slot: CourseSlot): boolean => {
    const hasAfternoonLab = slot.labs.some(lab => afternoonLabSlots.includes(lab));
    const isMorningTheory = morningTheorySlots.includes(slot.theory);
    return isMorningTheory && (slot.labs.length === 0 || hasAfternoonLab);
  };

  const getSlotsOccupied = (slot: CourseSlot): Set<string> => {
    const occupied = new Set<string>();

    if (slot.theory && slotToSchedule[slot.theory]) {
      slotToSchedule[slot.theory].forEach(schedule => {
        occupied.add(`${schedule.day}-${schedule.time}`);
      });
    }

    if (slot.tutorial && slotToSchedule[slot.tutorial]) {
      slotToSchedule[slot.tutorial].forEach(schedule => {
        occupied.add(`${schedule.day}-${schedule.time}`);
      });
    }

    slot.labs.forEach(lab => occupied.add(lab));

    return occupied;
  };

  const hasConflict = (slots1: CourseSlot, slots2: CourseSlot): boolean => {
    const occupied1 = getSlotsOccupied(slots1);
    const occupied2 = getSlotsOccupied(slots2);

    for (const slot of occupied1) {
      if (occupied2.has(slot)) return true;
    }
    return false;
  };

  const generateTimetables = () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one course');
      return;
    }

    const results: Timetable[] = [];
    const newClashInfo: {course1: string, course2: string, slot1: string, slot2: string}[] = [];
    
    const courseOptions = selectedCourses.map(courseId => {
      const course = courses.find(c => c.name === courseId);
      return course!.slots;
    });

    // Check for clashes before generating timetables
    for (let i = 0; i < selectedCourses.length; i++) {
      for (let j = i + 1; j < selectedCourses.length; j++) {
        const course1 = selectedCourses[i];
        const course2 = selectedCourses[j];
        
        const slots1 = courseOptions[i];
        const slots2 = courseOptions[j];
        
        let hasAnyValidCombination = false;
        
        for (const slot1 of slots1) {
          for (const slot2 of slots2) {
            if (!hasConflict(slot1, slot2)) {
              hasAnyValidCombination = true;
              break;
            } else {
              // Store clash information with more details
              newClashInfo.push({
                course1,
                course2,
                slot1: slot1.theory,
                slot2: slot2.theory
              });
            }
          }
          if (hasAnyValidCombination) break;
        }
      }
    }
    
    setClashInfo(newClashInfo);

    const generate = (index: number, current: CourseSlot[]) => {
      if (index === courseOptions.length) {
        const isMorning = current.every(slot => isMorningBatch(slot));
        results.push({
          slots: current.map((slot, idx) => ({
            course: selectedCourses[idx],
            ...slot
          })),
          batchType: isMorning ? 'Morning' : 'Evening'
        });
        return;
      }

      // Try all options for each course with improved conflict detection
      for (const option of courseOptions[index]) {
        let conflict = false;
        for (const selectedSlot of current) {
          if (hasConflict(option, selectedSlot)) {
            conflict = true;
            break;
          }
        }

        if (!conflict) {
          generate(index + 1, [...current, option]);
        }
      }
    };

    generate(0, []);

    if (results.length === 0) {
      const clashDetails = newClashInfo.map(clash => 
        `${clash.course1} (${clash.slot1}) clashes with ${clash.course2} (${clash.slot2})`
      ).join('\n');
      
      alert(`No valid timetable combinations found. The selected courses have scheduling conflicts:\n\n${clashDetails}`);
      return;
    }

    // Sort results with morning/evening preference
    results.sort((a, b) => {
      if (preferMorning) {
        if (a.batchType === 'Morning' && b.batchType === 'Evening') return -1;
        if (a.batchType === 'Evening' && b.batchType === 'Morning') return 1;
      }
      return 0;
    });

    setGeneratedTimetables(results);
    setActiveTab('results');
    setSelectedTimetableIndex(0);
    setFilterType('all'); // Reset filter when generating new timetables
  };

  const toggleCourseSelection = (courseName: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseName)
        ? prev.filter(c => c !== courseName)
        : [...prev, courseName]
    );
  };

  const renderTimetableGrid = (timetable: Timetable) => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const theoryTimes = ['08:00-08:50', '08:55-09:45', '09:50-10:40', '10:45-11:35', '11:40-12:30', '12:35-13:25', 'LUNCH', '14:00-14:50', '14:55-15:45', '15:50-16:40', '16:45-17:35', '17:40-18:30', '18:35-19:25'];
    const labTimes = ['08:00-08:50', '08:50-09:40', '09:50-10:40', '10:40-11:30', '11:40-12:30', '12:30-13:20', 'LUNCH', '14:00-14:50', '14:50-15:40', '15:50-16:40', '16:40-17:30', '17:40-18:30', '18:30-19:20'];

    const theoryGrid: Record<string, Record<string, any>> = {};

    days.forEach(day => {
      theoryGrid[day] = {};
      theoryTimes.forEach(time => {
        theoryGrid[day][time] = null;
      });
    });

    const colors = [
      'from-blue-600 to-cyan-600',
      'from-green-600 to-emerald-600',
      'from-orange-600 to-red-600',
      'from-yellow-600 to-amber-600',
      'from-teal-600 to-blue-600',
      'from-red-600 to-rose-600',
      'from-cyan-600 to-sky-600',
      'from-emerald-600 to-green-600'
    ];

    timetable.slots.forEach((slot, idx) => {
      const color = colors[idx % colors.length];

      if (slot.theory && slotToSchedule[slot.theory]) {
        slotToSchedule[slot.theory].forEach(schedule => {
          if (theoryGrid[schedule.day] && theoryGrid[schedule.day][schedule.time] !== undefined) {
            theoryGrid[schedule.day][schedule.time] = {
              course: slot.course,
              courseCode: slot.courseCode || slot.theory,
              type: 'Theory',
              color: color,
              faculty: slot.faculty,
              slot: slot.theory
            };
          }
        });
      }

      if (slot.tutorial && slotToSchedule[slot.tutorial]) {
        slotToSchedule[slot.tutorial].forEach(schedule => {
          if (theoryGrid[schedule.day] && theoryGrid[schedule.day][schedule.time] !== undefined) {
            theoryGrid[schedule.day][schedule.time] = {
              course: slot.course,
              courseCode: slot.courseCode || slot.tutorial,
              type: 'Tutorial',
              color: color,
              faculty: slot.faculty,
              slot: slot.tutorial
            };
          }
        });
      }
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">Theory Schedule</h3>
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'morning' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilterType('morning')}
            >
              Morning
            </button>
            <button 
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'evening' ? 'bg-blue-400 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilterType('evening')}
            >
              Evening
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-blue-700 bg-blue-900 p-2 text-white font-bold">Time</th>
                {days.map(day => (
                  <th key={day} className="border border-blue-700 bg-blue-900 p-2 text-white font-bold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {theoryTimes.map(time => (
                <tr key={time}>
                  <td className="border border-gray-700 bg-gray-900 p-2 text-white font-semibold text-center whitespace-nowrap">
                    {time}
                  </td>
                  {time === 'LUNCH' ? (
                    <td colSpan={5} className="border border-gray-700 bg-gradient-to-r from-yellow-900 to-orange-900 p-3 text-center text-white font-bold">
                      LUNCH
                    </td>
                  ) : (
                    days.map(day => (
                      <td key={`${day}-${time}`} className="border border-gray-700 p-1 bg-gray-800">
                        {theoryGrid[day][time] ? (
                          <div className={`bg-gradient-to-br ${theoryGrid[day][time].color} p-2 rounded h-full min-h-[60px] flex flex-col justify-center`}>
                            <div className="font-bold text-white text-xs leading-tight">{theoryGrid[day][time].courseCode}</div>
                            <div className="text-[10px] text-gray-100 mt-0.5 leading-tight">{theoryGrid[day][time].course}</div>
                            <div className="text-[9px] text-gray-200 mt-1 leading-tight">{theoryGrid[day][time].faculty}</div>
                            <div className="text-[9px] text-yellow-300 font-semibold mt-0.5">{theoryGrid[day][time].slot}</div>
                          </div>
                        ) : null}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-green-400">Lab Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-green-700 bg-green-900 p-2 text-white font-bold">Time</th>
                  {days.map(day => (
                    <th key={day} className="border border-green-700 bg-green-900 p-2 text-white font-bold">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labTimes.map(time => (
                  <tr key={time}>
                    <td className="border border-gray-700 bg-gray-900 p-2 text-white font-semibold text-center whitespace-nowrap">
                      {time}
                    </td>
                    {time === 'LUNCH' ? (
                      <td colSpan={5} className="border border-gray-700 bg-gradient-to-r from-yellow-900 to-orange-900 p-3 text-center text-white font-bold">
                        LUNCH
                      </td>
                    ) : (
                      days.map(day => (
                        <td key={`${day}-${time}`} className="border border-gray-700 p-1 bg-gray-800"></td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {clashInfo.length > 0 && (
          <div className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
            <h3 className="text-lg font-bold text-red-400 mb-2">Slot Clashes Detected:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {clashInfo.map((clash, index) => (
                <li key={index} className="text-red-300 text-sm">
                  {clash.course1} ({clash.slot1}) clashes with {clash.course2} ({clash.slot2})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              FFCS Timetable Generator
            </h1>
            <Calendar className="w-10 h-10 text-blue-400" />
          </div>
          <p className="text-gray-400 text-lg">Generate optimal timetables in seconds</p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-2 rounded-xl">
          {(['input', 'select', 'results'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'input' && 'Upload CSV'}
              {tab === 'select' && 'Select Courses'}
              {tab === 'results' && 'Results'}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {activeTab === 'input' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-xl border border-blue-500">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-bold text-blue-300">CSV File Format Guide</h2>
                </div>
                <p className="text-gray-300 mb-4">Your CSV file should have these columns:</p>

                <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="border border-gray-700 p-2 text-left text-yellow-400">Course title</th>
                        <th className="border border-gray-700 p-2 text-left text-green-400">AB3-704 location</th>
                        <th className="border border-gray-700 p-2 text-left text-blue-400">AB3-705 location</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-700 p-2 text-gray-300">Deep Learning</td>
                        <td className="border border-gray-700 p-2 text-green-300 font-mono text-xs">A1:Dr.Prakash</td>
                        <td className="border border-gray-700 p-2 text-blue-300 font-mono text-xs">F1:Dr.John</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 p-2 text-gray-300">Business Analytics</td>
                        <td className="border border-gray-700 p-2 text-green-300 font-mono text-xs">B1+L37+L38:Dr.Smith</td>
                        <td className="border border-gray-700 p-2 text-blue-300 font-mono text-xs">B2:Dr.Johnson</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <p><strong className="text-cyan-400">Format:</strong> SLOT+LAB1+LAB2:FACULTY</p>
                  <p><strong className="text-cyan-400">Example:</strong> A1+L37+L38:Dr.Prakash</p>
                </div>
              </div>

              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                <h2 className="text-2xl font-bold mb-2">Upload Your Course CSV</h2>
                <p className="text-gray-400 mb-6">Upload your FFCS course data file</p>

                <label className="inline-block cursor-pointer">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                    Choose CSV File
                  </div>
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                </label>
              </div>

              {courses.length > 0 && (
                <div className="mt-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg">
                  <CheckCircle className="w-6 h-6 inline mr-2" />
                  <span className="font-semibold">{courses.length} courses loaded!</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'select' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Select Your Courses</h2>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="preferMorning" checked={preferMorning} onChange={(e) => setPreferMorning(e.target.checked)} className="w-5 h-5" />
                  <label htmlFor="preferMorning" className="text-sm">Prefer Morning Batch</label>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                  <p className="text-gray-400 text-lg">Please upload a CSV file first</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {courses.map(course => (
                    <div
                      key={course.name}
                      onClick={() => toggleCourseSelection(course.name)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${selectedCourses.includes(course.name) ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{course.name}</h3>
                          <p className="text-sm text-gray-300 mt-1">{course.slots.length} option(s) available</p>
                        </div>
                        {selectedCourses.includes(course.name) && <CheckCircle className="w-6 h-6" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCourses.length > 0 && (
                <button onClick={generateTimetables} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl">
                  Generate Timetables
                </button>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {generatedTimetables.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                  <p className="text-gray-400 text-lg">No timetables generated yet</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Found {generatedTimetables.length} Timetable(s)</h2>
                    <div className="flex items-center gap-2">
                      <div className={`px-4 py-2 rounded-full font-bold ${generatedTimetables[selectedTimetableIndex]?.batchType === 'Morning' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' : 'bg-gradient-to-r from-cyan-400 to-blue-400'}`}>
                        {generatedTimetables[selectedTimetableIndex]?.batchType} Batch
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                          onClick={() => setFilterType('all')}
                        >
                          All
                        </button>
                        <button 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'morning' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                          onClick={() => setFilterType('morning')}
                        >
                          Morning
                        </button>
                        <button 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'evening' ? 'bg-blue-400 text-white' : 'bg-gray-700 text-gray-300'}`}
                          onClick={() => setFilterType('evening')}
                        >
                          Evening
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {generatedTimetables
                      .filter(timetable => {
                        if (filterType === 'all') return true;
                        if (filterType === 'morning') return timetable.batchType === 'Morning';
                        if (filterType === 'evening') return timetable.batchType === 'Evening';
                        return true;
                      })
                      .map((_, idx) => (
                        <button key={idx} onClick={() => setSelectedTimetableIndex(idx)} className={`px-4 py-2 rounded-lg font-semibold ${selectedTimetableIndex === idx ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                          Option {idx + 1}
                        </button>
                      ))}
                  </div>

                  <div className="bg-gray-900 p-4 rounded-xl">
                    {renderTimetableGrid(generatedTimetables[selectedTimetableIndex])}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <h3 className="font-bold text-lg">Course Details:</h3>
                    {generatedTimetables[selectedTimetableIndex].slots.map((slot, idx) => (
                      <div key={idx} className="bg-gray-700 p-4 rounded-lg">
                        <div className="font-bold text-cyan-400">{slot.course}</div>
                        <div className="text-sm text-gray-300 mt-2 space-y-1">
                          <div>Theory: {slot.theory}</div>
                          {slot.tutorial && <div>Tutorial: {slot.tutorial}</div>}
                          {slot.labs.length > 0 && <div>Labs: {slot.labs.join(', ')}</div>}
                          <div>Faculty: {slot.faculty}</div>
                          <div>Location: {slot.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
