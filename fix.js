const fs = require('fs');

let book = fs.readFileSync('client/src/pages/BookSessionPage.jsx', 'utf8');
if (!book.includes('const fetchUser = useAuthStore')) {
  book = book.replace('const user = useAuthStore(state => state.user);', 'const user = useAuthStore(state => state.user);\n  const fetchUser = useAuthStore(state => state.fetchUser);');
  book = book.replace('setStep(4); // Success step', 'fetchUser();\n        setStep(4); // Success step');
  fs.writeFileSync('client/src/pages/BookSessionPage.jsx', book);
}

let sess = fs.readFileSync('client/src/pages/SessionsPage.jsx', 'utf8');
if (!sess.includes('const fetchUser = useAuthStore')) {
  sess = sess.replace('const user = useAuthStore(state => state.user);', 'const user = useAuthStore(state => state.user);\n  const fetchUser = useAuthStore(state => state.fetchUser);');
  sess = sess.replace(/await api\.put\(`\/sessions\/\$\{id\}\/\$\{action\}`\);\s*await fetchSessions\(\);/g, 'await api.put(`/sessions/${id}/${action}`);\n        await fetchSessions();\n        fetchUser();');
  sess = sess.replace(/await api\.put\(`\/sessions\/\$\{session\.id\}\/complete`\);\s*fetchSessions\(\);/g, 'await api.put(`/sessions/${session.id}/complete`);\n        fetchSessions();\n        fetchUser();');
  fs.writeFileSync('client/src/pages/SessionsPage.jsx', sess);
}
