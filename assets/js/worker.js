import { parseAll } from "./core/parser.js";
import { checkMessage } from "./core/validate.js";

self.onmessage = (e) => {
  const { id, text } = e.data;
  try {
    const r = parseAll(text, { limit: 500 });
    r.messages.forEach(checkMessage);
    self.postMessage({ id, result: { messages: r.messages, total: r.total, notes: r.notes } });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
