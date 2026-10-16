const $ = (id) => document.getElementById(id);

function addResult(container, title, detail, kind = "warn") {
  const item = document.createElement("div");
  item.className = "result-item";
  const strong = document.createElement("strong");
  strong.className = kind;
  strong.textContent = title;
  const body = document.createElement("div");
  body.textContent = detail;
  item.append(strong, body);
  container.appendChild(item);
}

$("url-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = $("site-url").value.trim();
  const out = $("url-results");
  out.replaceChildren();
  let url;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    addResult(out, "URL সঠিক নয়", "যেমন: https://example.com — সঠিক ওয়েব ঠিকানা লিখো।", "bad");
    return;
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
    addResult(out, "URL যাচাই ব্যর্থ", "একটি বৈধ পাবলিক ওয়েবসাইটের URL দাও।", "bad");
    return;
  }
  if (url.username || url.password) {
    addResult(out, "সতর্কতা", "URL-এ username/password আছে। এগুলো URL-এ রাখা উচিত নয়।", "bad");
  }
  addResult(out, url.protocol === "https:" ? "HTTPS ব্যবহার করা হয়েছে" : "HTTPS নেই", 
    url.protocol === "https:" ? "URL HTTPS দিয়ে শুরু হয়েছে। এটি ভালো লক্ষণ, তবে সাইট নিরাপদ—এটি একা প্রমাণ করে না।" : "সাইটটি HTTPS দিয়ে খোলে কি না যাচাই করো এবং বৈধ TLS সার্টিফিকেট ব্যবহার করো।",
    url.protocol === "https:" ? "good" : "bad");
  addResult(out, "হোস্টনেম", url.hostname, "good");
  addResult(out, "পরবর্তী ধাপ", "এই প্রাথমিক সংস্করণ দূরবর্তী সার্ভারের HTTP headers, TLS certificate বা দুর্বলতা স্ক্যান করে না। পূর্ণ স্ক্যানের জন্য নিরাপদ backend যুক্ত করতে হবে।", "warn");
  addResult(out, "অনুমতি", "শুধু নিজের বা লিখিত অনুমতি আছে এমন সাইটেই পরবর্তী নিরাপত্তা পরীক্ষা চালাও।", "warn");
});

$("analyze-code").addEventListener("click", () => {
  const code = $("code-input").value;
  const out = $("code-results");
  out.replaceChildren();
  if (!code.trim()) {
    addResult(out, "কোড দেওয়া হয়নি", "প্রথমে নিজের HTML বা JavaScript কোড পেস্ট করো।", "warn");
    return;
  }
  let found = 0;
  const checks = [
    {re:/\beval\s*\(/i, title:"eval() ব্যবহার", detail:"eval() অনিরাপদ ইনপুট চালাতে পারে। সম্ভব হলে বাদ দাও; প্রয়োজন হলে ইনপুট ও ডিজাইন পুনর্বিবেচনা করো।"},
    {re:/innerHTML\s*=/i, title:"innerHTML assignment", detail:"অবিশ্বস্ত ডেটা innerHTML-এ দিলে XSS হতে পারে। textContent বা নিরাপদ sanitization ব্যবহার করো।"},
    {re:/document\.write\s*\(/i, title:"document.write() ব্যবহার", detail:"ডাইনামিক/অবিশ্বস্ত ডেটা document.write-এ দেওয়া ঝুঁকিপূর্ণ হতে পারে। DOM API ব্যবহার করো।"},
    {re:/(api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{6,}["']/i, title:"কোডে সম্ভাব্য গোপন তথ্য", detail:"API key বা password সরাসরি frontend কোডে রেখো না। exposed key বাতিল করে server-side secret হিসেবে রাখো।"},
    {re:/http:\/\/(?!localhost|127\.0\.0\.1)/i, title:"HTTP লিংক", detail:"প্রোডাকশনে সম্ভব হলে HTTPS ব্যবহার করো; HTTP ট্রাফিক এনক্রিপ্ট করে না।"},
    {re:/Access-Control-Allow-Origin\s*:\s*\*/i, title:"CORS wildcard", detail:"সব origin-কে অনুমতি দেওয়া সব ক্ষেত্রে উপযুক্ত নয়। প্রয়োজনীয় trusted origin-এ সীমিত করো।"}
  ];
  checks.forEach((check) => {
    if (check.re.test(code)) {
      addResult(out, check.title, check.detail, "warn");
      found++;
    }
  });
  if (!found) addResult(out, "এই নিয়মগুলোতে কোনো মিল পাওয়া যায়নি", "এটি নিরাপত্তার নিশ্চয়তা নয়। এই checker সীমিত pattern দেখে; পূর্ণ code review ও test দরকার।", "good");
  addResult(out, "সীমাবদ্ধতা", "এটি শিক্ষামূলক pattern checker, পূর্ণাঙ্গ static analyzer নয়। ফলাফল একজন নিরাপত্তা বিশেষজ্ঞের review দিয়ে যাচাই করো।", "warn");
});

const answers = [
  {keys:["https","tls","certificate"], answer:"HTTPS হলো HTTP-এর এনক্রিপ্টেড সংস্করণ, যা ব্রাউজার ও সার্ভারের মধ্যে ডেটা সুরক্ষিত রাখতে সাহায্য করে। বৈধ TLS certificate, HTTPS redirect এবং নিরাপদ TLS configuration ব্যবহার করো।"},
  {keys:["csp","content security policy"], answer:"Content Security Policy (CSP) একটি HTTP response header, যা ব্রাউজারে কোন উৎস থেকে script, style, image ইত্যাদি লোড হতে পারবে তা সীমিত করে। আগে Report-Only মোডে পরীক্ষা করে পরে উপযুক্ত policy প্রয়োগ করো।"},
  {keys:["xss","cross-site scripting"], answer:"XSS হলো এমন দুর্বলতা যেখানে ওয়েব পেজে অনিরাপদভাবে ডেটা বসানোর কারণে অন্য ব্যবহারকারীর ব্রাউজারে অনিচ্ছাকৃত script চলতে পারে। textContent, context-aware output encoding, নিরাপদ templating এবং CSP সাহায্য করে।"},
  {keys:["পদক্ষেপ","নিরাপদ","৫টি","নিরাপত্তা"], answer:"শুরুতে: (১) HTTPS ও বৈধ certificate, (২) সফটওয়্যার/লাইব্রেরি আপডেট, (৩) MFA ও শক্তিশালী authentication, (৪) ইনপুট validation এবং output encoding, (৫) ব্যাকআপ, লগ মনিটরিং ও security headers।"}
];
function answerQuestion(q) {
  const normalized = q.toLowerCase();
  const match = answers.find(item => item.keys.some(key => normalized.includes(key)));
  return match ? match.answer : "আমি এখন অফলাইন শিক্ষামূলক নিয়ম দিয়ে উত্তর দিচ্ছি। HTTPS, CSP, XSS বা ওয়েবসাইট নিরাপদ করার পদক্ষেপ সম্পর্কে প্রশ্ন করো। লাইভ AI যুক্ত করতে পরের ধাপে একটি backend ও নিরাপদ API configuration লাগবে।";
}
function showAnswer(q) {
  const out = $("learn-answer");
  out.replaceChildren();
  const div = document.createElement("div");
  div.className = "answer";
  div.textContent = answerQuestion(q);
  out.appendChild(div);
}
$("learn-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const q = $("question").value.trim();
  if (q) showAnswer(q);
});
document.querySelectorAll(".prompt").forEach(button => {
  button.addEventListener("click", () => {
    $("question").value = button.dataset.question;
    showAnswer(button.dataset.question);
  });
});
