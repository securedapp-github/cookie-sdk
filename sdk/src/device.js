export function getDeviceId() {
  let deviceId = localStorage.getItem('consent_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('consent_device_id', deviceId);
  }
  return deviceId;
}
