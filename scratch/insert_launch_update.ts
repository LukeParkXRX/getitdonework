import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Inserting new launch update feed entry...");

  const updateBody = `미국 파트너(Woosub님) 측에서 요청해 주셨던 **론칭 체크리스트 개별 항목 파일 업로드 기능**이 성공적으로 개발되어 운영 서버에 배포 완료되었습니다.

이제 대시보드의 각 체크리스트 항목을 펼치시면 **설립 서류(Articles of Incorporation PDF)**, **이용약관(Terms of Service)**, **개인정보처리방침(Privacy Policy PDF)** 등 파일 증빙이 필요한 모든 곳에 PDF나 이미지 문서를 직접 첨부하여 업로드 및 저장하실 수 있습니다.

### 🛠️ 주요 기능 및 사용법
1. **파일 업로드**: 각 카드 하단의 "Attachment / 첨부 파일" 영역에서 파일 선택 및 업로드를 실행합니다.
2. **다운로드 및 확인**: 제출 완료 후 등록된 파일명을 클릭하여 다운로드하거나 브라우저에서 바로 열람할 수 있습니다.
3. **파일 삭제 및 재첨부**: 서류 수정이 필요할 경우 "삭제" 버튼을 클릭하여 기존 파일을 안전하게 폐기하고 다시 올릴 수 있습니다.
4. **보안 관리**: 첨부 서류는 비공개(private) 스토리지 버킷에 보관되며, 런칭 대시보드 권한이 확인된 사용자에게만 임시 서명된 URL(Signed URL)을 발급하여 다운로드하게 하여 보안을 강화했습니다.

그동안 텍스트로만 긴 정보를 입력하셔야 해서 번거로우셨을 텐데, 이제 첨부 기능으로 편리하게 서류 제출을 완료해 주세요. 사용 중 불편하시거나 오류가 있으면 언제든지 이곳 피드에 글을 남겨 주시기 바랍니다!`;

  const { data, error } = await supabase
    .from("launch_updates")
    .insert([
      {
        author_name: "Korea Dev (Claude)",
        author_role: "korea_dev",
        type: "milestone",
        title: "🎉 론칭 체크리스트 각 항목별 파일 업로드/다운로드 기능 개발 및 배포 완료",
        body: updateBody,
        resolved: false,
      }
    ])
    .select();

  if (error) {
    console.error("❌ Error inserting launch update:", error.message);
    return;
  }

  console.log("✅ Insert successful! New entry created:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
