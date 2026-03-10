import test from "node:test";
import assert from "node:assert/strict";

import { slugify } from "@/lib/slugify";

test("slugify normalizes anime titles", () => {
  assert.equal(slugify("Frieren: Beyond Journey's End"), "frieren-beyond-journey-s-end");
});