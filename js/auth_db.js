// Very simple localStorage-based auth database for prototype
const AUTH_DB_KEY = 'osondoson_users_v1';

function getUsers() {
  try {
    const raw = localStorage.getItem(AUTH_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('auth_db: parse error', e);
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(users));
}

export function signupUser(profile) {
  // profile: { phone, password, name, unit }
  const users = getUsers();
  if (!profile || !profile.phone) throw new Error('전화번호가 필요합니다');
  const phone = normalizePhone(profile.phone);
  if (users[phone]) throw new Error('이미 가입된 전화번호입니다');
  users[phone] = {
    phone,
    password: String(profile.password || ''),
    name: String(profile.name || ''),
    unit: String(profile.unit || ''),
    createdAt: Date.now()
  };
  saveUsers(users);
  return users[phone];
}

export function loginUser(phone, password) {
  const users = getUsers();
  const key = normalizePhone(phone);
  const u = users[key];
  if (!u) throw new Error('가입되지 않은 전화번호입니다');
  if (String(password) !== String(u.password)) throw new Error('비밀번호가 올바르지 않습니다');
  return u;
}

export function normalizePhone(p) {
  return String(p || '').replace(/\D/g, '');
}


