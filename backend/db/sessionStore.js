'use strict';

const { EventEmitter } = require('events');
const db = require('./index');

const expressSession = require('express-session');

function createSessionStore(ttlMs) {
  const store = new EventEmitter();

  const getStmt = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expires > ?');
  const setStmt = db.prepare('INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires');
  const destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
  const touchStmt = db.prepare('UPDATE sessions SET expires = ? WHERE sid = ?');
  const cleanupStmt = db.prepare('DELETE FROM sessions WHERE expires <= ?');

  store.createSession = function (req, sess) {
    req.session = new expressSession.Session(req, sess);
    return req.session;
  };

  store.get = function (sid, cb) {
    try {
      const row = getStmt.get(sid, Date.now());
      cb(null, row ? JSON.parse(row.sess) : null);
    } catch (err) {
      cb(err);
    }
  };

  store.set = function (sid, sess, cb) {
    try {
      setStmt.run(sid, JSON.stringify(sess), Date.now() + ttlMs);
      cb(null);
    } catch (err) {
      cb(err);
    }
  };

  store.destroy = function (sid, cb) {
    try {
      destroyStmt.run(sid);
      cb(null);
    } catch (err) {
      cb(err);
    }
  };

  store.touch = function (sid, sess, cb) {
    try {
      touchStmt.run(Date.now() + ttlMs, sid);
      cb(null);
    } catch (err) {
      cb(err);
    }
  };

  store.clearExpired = function () {
    try {
      cleanupStmt.run(Date.now());
    } catch {
      /* best effort */
    }
  };

  return store;
}

module.exports = createSessionStore;