import { formatListTime } from "./list-time-format.js";

const localFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

class LocalTime extends HTMLElement {
  connectedCallback() {
    const instant = new Date(this.getAttribute("datetime"));
    if (Number.isNaN(instant.getTime())) return;
    this.title = this.textContent.trim();
    this.textContent =
      this.getAttribute("format") === "list"
        ? formatListTime(instant)
        : localFormatter.format(instant);
  }
}

customElements.define("local-time", LocalTime);
