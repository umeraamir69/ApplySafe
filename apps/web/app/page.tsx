import { Checker } from "@/components/checker";
import { DEMOS } from "@/lib/demos";

export default function HomePage() {
  return (
    <main>
      <h1>Check the message before you reply</h1>
      <p className="lede">
        Paste a job text or a recruiter chat. Canada rules highlight the phrases
        that fired. A model score sits beside them and cannot cancel a hard hit.
      </p>
      <Checker demos={DEMOS} />
      <h2>Scan API</h2>
      <p className="lede">Same check as the box. The demo key is ask_demo. It allows 30 scans in 10 minutes.</p>
      <pre className="message">{`curl -s http://localhost:3000/v1/scan \\
  -H "Authorization: Bearer ask_demo" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"send SIN on Telegram","include_brain":true}'`}</pre>
    </main>
  );
}
