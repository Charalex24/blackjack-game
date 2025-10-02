<?php
header("Content-Type: application/json");

$apiKey = "AIzaSyAOEd3rGDWKbeVqc58HpIHGi9u8gWpZXPQ";

// Read JSON input from client
$input = json_decode(file_get_contents("php://input"), true);
$playerHand = $input['playerHand'] ?? [];
$dealerUpCard = $input['dealerUpCard'] ?? '';

// Compose the prompt
$handText = implode(", ", $playerHand);
$prompt = "Blackjack player hand: $handText, dealer up card: $dealerUpCard. 
Give only 'hit' or 'stand', and explain your reasoning in one short sentence.";

// Gemini API payload
$data = [
    "contents" => [
        ["parts" => [["text" => $prompt]]]
    ]
];

$ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "X-goog-api-key: $apiKey"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(["suggestion" => "stand — default", "reason" => "API error"]);
    exit;
}
curl_close($ch);

// Parse response safely
$suggestion = "stand"; // fallback
$reason = "default";

if ($response) {
    $respObj = json_decode($response, true);

    // Gemini sometimes returns 'candidates' -> [0] -> 'content' -> array of parts
    if (isset($respObj['candidates'][0]['content']) && is_array($respObj['candidates'][0]['content'])) {
        $textParts = $respObj['candidates'][0]['content'];
        $fullText = "";
        foreach ($textParts as $part) {
            if (isset($part['text'])) {
                $fullText .= $part['text'] . " ";
            }
        }
        $fullText = trim($fullText);

        // Extract suggestion and reasoning
        $fullTextLower = strtolower($fullText);
        if (strpos($fullTextLower, 'hit') !== false) $suggestion = 'hit';
        if (strpos($fullTextLower, 'stand') !== false) $suggestion = 'stand';

        // Remove the keyword to keep only reasoning
        $reason = trim(str_ireplace($suggestion, '', $fullText));
        if ($reason === "") $reason = "No explanation provided.";
    }
}

echo json_encode([
    "suggestion" => $suggestion,
    "reason" => $reason
]);
