# Wordle-search
## About this app
This app lets you search for potential Wordle answers in two different ways.
The search is performed against a word list compiled from several dictionaries and word lists, with all previous official Wordle answers excluded.

<details><summary>RegEx Search</summary>

This is the app's core feature.
Use a regular expression (regex) to specify your search criteria and filter matching words.
If you're unfamiliar with regex syntax, please refer to the reference sites below.
- [RegexOne](https://www.regexone.com/?utm_source=chatgpt.com)

![RegEx search](./images/en-regex.png)

</details>

<details><summary>Wordle-like Search</summary>

This mode allows you to create a regular expression (regex) using a Wordle-style touch keyboard and grid panel, then search for matching words.

![Wordle-like search](./images/en-wordle.png)
In this help guide, the following terms are used:
- Letter Grid
- Touch Keyboard

![Woedle風検索の使い方](./images/en-keyboard.png)
- <i class="fa-solid fa-keyboard"></i>: Click to open the touch keyboard.
- Touch keyboards:
  - <i class="fa-solid fa-delete-left"></i>: Click to delete the previous character.
  - <i class="fa-solid fa-trash"></i>: to clear the current row.
- Click an entered letter in word grid to cycle its status:
  - 🟩 Correct
  - 🟨 Present / Wrong Position
  - ⬜ Absent / Not in Word
- "Clear": clear all input.
 
</details>
