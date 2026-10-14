import { Checker } from "@/components/checker";
import { DEMOS } from "@/lib/demos";

export default function HomePage() {
  return (
    <main>
      <h1>Check the message before you reply</h1>
      <p className="lede">
        Paste a job text or a recruiter chat. Canada rules highlight the phrases
        that fired. This page does not use a model.
      </p>
      <Checker demos={DEMOS} />
    </main>
  );
}
