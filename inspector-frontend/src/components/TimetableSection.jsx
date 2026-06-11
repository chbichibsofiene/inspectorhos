import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getTimetable, addTimetableSlot, deleteTimetableSlot } from "../api/timetable";
import profileApi from "../api/profile";
import { Clock, MapPin, Plus, Trash2, Calendar } from "lucide-react";

export default function TimetableSection() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "MONDAY",
    startTime: "08:00",
    endTime: "09:00",
    subject: "",
    classroom: "",
    level: ""
  });

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const allowedSlotDays = days.filter((day) => day !== "SUNDAY");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ttRes, subRes] = await Promise.all([
        getTimetable(),
        profileApi.getSubjects()
      ]);
      setSlots(ttRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
      
      if (subRes.data?.data?.length > 0) {
        setNewSlot(prev => ({ ...prev, subject: subRes.data.data[0].name }));
      }
    } catch (err) {
      setError(t('failedToLoadTimetable'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSlot(e) {
    e.preventDefault();
    setError("");
    if (newSlot.dayOfWeek === "SUNDAY") {
      setError("Sunday slots are not allowed.");
      return;
    }
    try {
      await addTimetableSlot(newSlot);
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || t('failedToAddSlot'));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('confirmDeleteSlot'))) return;
    try {
      await deleteTimetableSlot(id);
      loadData();
    } catch (err) {
      setError(t('failedToDeleteSlot'));
    }
  }

  const groupedSlots = days.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  return (
    <section className="card timetable-card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('myWeeklyTimetable')}</div>
          <div className="card-subtitle">{t('manageWeeklyClasses')}</div>
        </div>
        <button className="compact-btn" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {t('addSlot')}
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="timetable-container">
        {days.map(day => (
          <div key={day} className="timetable-day-column">
            <h4 className="day-name">{t(day.charAt(0) + day.slice(1).toLowerCase())}</h4>
            <div className="day-slots">
              {groupedSlots[day].length === 0 ? (
                <div className="empty-day">{t('noClasses')}</div>
              ) : (
                groupedSlots[day].map(slot => (
                  <div key={slot.id} className="slot-item">
                    <div className="slot-time">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="slot-main">
                      <strong>{slot.subject}</strong>
                      <span>{slot.level}</span>
                    </div>
                    <div className="slot-footer">
                      <MapPin size={12} /> {slot.classroom || "N/A"}
                    </div>
                    <button className="delete-slot-btn" onClick={() => handleDelete(slot.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="card-header">
              <div className="card-title">{t('addTimetableSlot')}</div>
            </div>
            <form onSubmit={handleAddSlot} className="activity-form">
              <div className="form-row">
                <label>
                  {t('dayOfWeek')}
                  <select 
                    value={newSlot.dayOfWeek} 
                    onChange={e => setNewSlot({...newSlot, dayOfWeek: e.target.value})}
                  >
                    {allowedSlotDays.map(d => <option key={d} value={d}>{t(d.charAt(0) + d.slice(1).toLowerCase())}</option>)}
                  </select>
                </label>
                <label>
                  {t('subject')}
                  <select 
                    value={newSlot.subject} 
                    onChange={e => setNewSlot({...newSlot, subject: e.target.value})}
                  >
                    {subjects.map(s => (
                      <option key={s.name} value={s.name}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  {t('startTime')}
                  <input 
                    type="time" 
                    value={newSlot.startTime} 
                    onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                    required
                  />
                </label>
                <label>
                  {t('endTime')}
                  <input 
                    type="time" 
                    value={newSlot.endTime} 
                    onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                    required
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  {t('classLevel')}
                  <input 
                    type="text" 
                    placeholder="e.g. 3rd Grade A"
                    value={newSlot.level} 
                    onChange={e => setNewSlot({...newSlot, level: e.target.value})}
                    required
                  />
                </label>
                <label>
                  {t('classroom')}
                  <input 
                    type="text" 
                    placeholder="e.g. Room 102"
                    value={newSlot.classroom} 
                    onChange={e => setNewSlot({...newSlot, classroom: e.target.value})}
                  />
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: "1rem" }}>
                <button type="submit">{t('saveSlot')}</button>
                <button type="button" className="secondary-action-btn" onClick={() => setShowModal(false)}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
