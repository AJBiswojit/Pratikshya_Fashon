/**
 * PRATIKSHYA FASHON — Attendance settings (demo working hours + calendar).
 *
 * Stored separately so Phase 20 Settings can own this namespace later.
 */

import {
  ATTENDANCE_DEFAULTS,
  ATTENDANCE_SETTINGS_KEY,
  HOUSE_HOLIDAYS,
} from "../../config/attendanceConfig";
import { readStorage, writeStorage } from "../../utils/shopping";

const normaliseSettings = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const weekOff = Array.isArray(source.weekOffWeekdays)
    ? source.weekOffWeekdays.map((day) => Number(day)).filter((day) => day >= 0 && day <= 6)
    : ATTENDANCE_DEFAULTS.weekOffWeekdays;
  const holidays = Array.isArray(source.holidays) && source.holidays.length
    ? source.holidays
        .filter((item) => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
        .map((item) => ({ date: item.date, name: String(item.name || "Holiday") }))
    : HOUSE_HOLIDAYS;

  return {
    workingStartTime: source.workingStartTime || ATTENDANCE_DEFAULTS.workingStartTime,
    workingEndTime: source.workingEndTime || ATTENDANCE_DEFAULTS.workingEndTime,
    lateThresholdMinutes: Math.max(0, Number(source.lateThresholdMinutes) || ATTENDANCE_DEFAULTS.lateThresholdMinutes),
    minimumHalfDayMinutes: Math.max(0, Number(source.minimumHalfDayMinutes) || ATTENDANCE_DEFAULTS.minimumHalfDayMinutes),
    fullDayMinutes: Math.max(1, Number(source.fullDayMinutes) || ATTENDANCE_DEFAULTS.fullDayMinutes),
    weekOffWeekdays: weekOff.length ? weekOff : ATTENDANCE_DEFAULTS.weekOffWeekdays,
    holidays,
  };
};

export const loadAttendanceSettings = () => {
  const stored = readStorage(ATTENDANCE_SETTINGS_KEY, null);
  const settings = normaliseSettings(stored);
  if (!stored || typeof stored !== "object") {
    writeStorage(ATTENDANCE_SETTINGS_KEY, settings);
  }
  return settings;
};

export const saveAttendanceSettings = (patch = {}) => {
  const next = normaliseSettings({ ...loadAttendanceSettings(), ...patch });
  writeStorage(ATTENDANCE_SETTINGS_KEY, next);
  return next;
};

export default {
  loadAttendanceSettings,
  saveAttendanceSettings,
};
