import { describe, expect, it } from "vitest";
import { parseExtractionResult } from "@/lib/ai/gemini";

describe("parseExtractionResult", () => {
  it("parses plain JSON responses", () => {
    const result = parseExtractionResult(`
      {
        "worksheet_summary": "Basic arithmetic worksheet using direct equations.",
        "detected_class_level": "Grade 1",
        "detected_subject": "Mathematics",
        "style_notes": "Short computation prompts with simple wording.",
        "generation_mode": "preserve_structure",
        "questions": [
          {
            "question_text": "2 + 2 = ?",
            "answer_text": "4",
            "answer_options": ["3", "4", "5"],
            "accepted_answer_variants": ["four", " 4 "],
            "question_type": "short",
            "grading_mode": "keyword_match",
            "required_keywords": ["addition", "sum", 7, ""],
            "minimum_keyword_matches": 2,
            "numeric_tolerance": 0.5,
            "source_page": 1,
            "source_order": 2,
            "layout_hint": "mcq_inline",
            "generation_basis": "extracted",
            "style_notes": "Matches the worksheet's one-line arithmetic format."
          }
        ]
      }
    `);

    expect(result).toMatchObject({
      worksheet_summary: "Basic arithmetic worksheet using direct equations.",
      detected_class_level: "Grade 1",
      detected_subject: "Mathematics",
      style_notes: "Short computation prompts with simple wording.",
      generation_mode: "preserve_structure",
    });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      question_text: "2 + 2 = ?",
      answer_text: "4",
      answer_options: ["3", "4", "5"],
      accepted_answer_variants: ["four", "4"],
      question_type: "short",
      grading_mode: "keyword_match",
      required_keywords: ["addition", "sum"],
      minimum_keyword_matches: 2,
      numeric_tolerance: 0.5,
      source_page: 1,
      source_order: 2,
      layout_hint: "mcq_inline",
      generation_basis: "extracted",
      style_notes: "Matches the worksheet's one-line arithmetic format.",
    });
  });

  it("parses fenced JSON responses and normalizes invalid question types", () => {
    const result = parseExtractionResult(`
      \`\`\`json
      {
        "questions": [
          {
            "question_text": "Earth is a planet.",
            "answer_text": "True",
            "answer_options": ["True", 0, ""],
            "accepted_answer_variants": ["yes", 42, ""],
            "question_type": "boolean",
            "grading_mode": "unexpected",
            "required_keywords": ["planet"],
            "explanation": "It orbits the Sun.",
            "generation_basis": "unexpected-value"
          }
        ]
      }
      \`\`\`
    `);

    expect(result.questions[0]).toMatchObject({
      question_text: "Earth is a planet.",
      answer_text: "True",
      answer_options: ["True", "False"],
      accepted_answer_variants: ["yes"],
      question_type: "true_false",
      grading_mode: "exact",
      layout_hint: "true_false_row",
      explanation: "It orbits the Sun.",
      generation_basis: "extracted",
    });
  });

  it("infers multiple choice and numeric tolerance defaults from weak model output", () => {
    const result = parseExtractionResult(`
      {
        "questions": [
          {
            "question_text": "What is 5 + 5?",
            "answer_text": "10",
            "answer_options": ["8", "10", "12"]
          }
        ]
      }
    `);

    expect(result.questions[0]).toMatchObject({
      question_text: "What is 5 + 5?",
      answer_text: "10",
      answer_options: ["8", "10", "12"],
      question_type: "multiple_choice",
      grading_mode: "exact",
      layout_hint: "mcq_vertical",
      numeric_tolerance: undefined,
    });
  });

  it("infers keyword match defaults when required keywords are present", () => {
    const result = parseExtractionResult(`
      {
        "questions": [
          {
            "question_text": "Explain photosynthesis.",
            "answer_text": "Plants use sunlight to make food.",
            "required_keywords": ["sunlight", "food", "chlorophyll"]
          }
        ]
      }
    `);

    expect(result.questions[0]).toMatchObject({
      question_type: "short",
      grading_mode: "keyword_match",
      required_keywords: ["sunlight", "food", "chlorophyll"],
      minimum_keyword_matches: 1,
    });
  });

  it("rejects responses with no usable questions", () => {
    expect(() =>
      parseExtractionResult(`
        {
          "questions": [
            {
              "question_text": "",
              "answer_text": ""
            }
          ]
        }
      `)
    ).toThrow("Gemini did not return any usable questions.");
  });

  it("merges split worksheet subparts back into a single grouped question", () => {
    const result = parseExtractionResult(`
      {
        "questions": [
          {
            "question_text": "Simplify",
            "answer_text": "(i) -8389\\n(ii) -35",
            "question_type": "short",
            "source_page": 1,
            "source_order": 6,
            "generation_basis": "extracted"
          },
          {
            "question_text": "(i) 900 - 9289",
            "answer_text": "-8389",
            "question_type": "short",
            "source_page": 1,
            "source_order": 7,
            "generation_basis": "extracted"
          },
          {
            "question_text": "(ii) 882 - 917",
            "answer_text": "-35",
            "question_type": "short",
            "source_page": 1,
            "source_order": 8,
            "generation_basis": "extracted"
          }
        ]
      }
    `);

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      question_text: "Simplify\n(i) 900 - 9289\n(ii) 882 - 917",
      answer_text: "(i) -8389\n(ii) -35",
      question_type: "short",
      source_order: 1,
      layout_hint: "paragraph_answer",
    });
  });
});
