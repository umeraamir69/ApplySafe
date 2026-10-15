const posting = document.querySelector("#jobDescriptionText");
posting.textContent =
  "Saw your resume online. Easy product-boost tasks 400 a day. Install our app, then pay 80 USDT to unlock withdrawal.";

document.querySelector("#go").addEventListener("click", () => {
  const extracted = ApplySafe.extract();
  const result = ApplySafe.scan(extracted.text, ApplySafe.rules);
  ApplySafe.show(extracted, result);
  document.body.dataset.verdict = result.verdict;
  document.body.dataset.hits = result.rules.hits.join(",");
});
