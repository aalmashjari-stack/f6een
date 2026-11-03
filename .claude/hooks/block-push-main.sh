#!/bin/bash
# يمنع الدفع إلى main: الفرع ينشر حيّاً على f6een.com، والطريق فرعٌ ثمّ PR
# (قرار علي ١ سبتمبر ٢٠٢٦، ومهارة /publish). يُرفض:
#   git push <remote> main | HEAD:main | refs/heads/main
#   git push / git push <remote> والفرع الحاليّ main
# الخروج 2 يمنع الأمر ويعيد السبب إلى Claude.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

block() {
  echo "ممنوع الدفع إلى main: ينشر حيّاً على f6een.com. ادفع إلى فرعٍ باسمه ثمّ PR (انظر /publish)." >&2
  exit 2
}

while IFS= read -r seg; do
  # أمرٌ يبدأ بـgit فعلاً، لا سطرٌ يذكره (رسالة commit أو جسم PR فيه «git push … main»).
  seg="${seg#"${seg%%[![:space:]]*}"}"
  case "$seg" in
    "git push"* | "git -C "*" push"*) ;;
    *) continue ;;
  esac
  # ما بعد كلمة push، بلا الخيارات
  args=$(printf '%s\n' "$seg" | sed -E 's/.*[[:space:]]push([[:space:]]|$)//')
  refs=()
  for t in $args; do
    case "$t" in -*) ;; *) refs+=("$t") ;; esac
  done
  for r in "${refs[@]:1}"; do
    case "$r" in
      main | *:main | refs/heads/main | *:refs/heads/main | +main | +*:main) block ;;
    esac
  done
  # بلا refspec: يدفع الفرع الحاليّ
  if [ "${#refs[@]}" -le 1 ]; then
    branch=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)
    [ "$branch" = main ] && block
  fi
done <<< "$(printf '%s\n' "$cmd" | tr ';&|' '\n\n\n')"

exit 0
