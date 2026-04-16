# Data Model Planning Worksheet

## **소개**
- 개발에 앞서 애플리케이션의 **데이터 구조를 최대한 체계적으로 정의**하는 것이 이 과제의 목표입니다.
- 엔터티, 필드, 관계, 권한, 비즈니스 규칙 등을 사전에 정리하는 작업은 **데이터 모델링의 오류나 누락을 줄이고**, 이후 개발의 방향성을 명확히 하는 데 큰 도움이 됩니다.
- **어떤 엔터티(데이터 객체)** 들이 존재하며, **서로 어떤 관계와 규칙**을 가지고 있는지를 중심으로 워크시트를 작성해보세요.
- 작성이 어렵다면, 함께 제공되는 예시를 참고하셔도 좋습니다.

## 1. 시스템의 핵심 엔터티(Entities)는 무엇인가요?
*애플리케이션에서 관리할 핵심 객체(주로 데이터베이스 테이블이 될 대상)를 모두 나열하세요.*

- `User`
- `Content`
- `Folder`
- `Tag`
- `Collaboration`
- `Content_Tag` (Join Table)
- `Comment`
- `UserSettings`

---

## 2. 각 엔터티의 필드를 정의하세요:
*각 엔터티에 대해 주요 속성과 데이터 타입, 필요한 제약 조건 등을 정의하세요.*

**User**
- `id` (UUID, Primary Key, Supabase Auth 제공)
- `email` (string, unique)
- `name` (string, nullable) - 사용자 이름
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Content**
- `id` (UUID, Primary Key)
- `user_id` (foreign key to User, not null) - 원본 소유자
- `folder_id` (foreign key to Folder, nullable) - 소속된 폴더
- `title` (string, nullable) - 링크 제목, 파일 이름 등
- `type` (enum: `'text'`, `'image'`, `'link'`, `'video'`, `'note'`, `'clipboard'`, `'screenshot'`) - 콘텐츠 유형
- `data` (JSONB) - 타입별 핵심 데이터 (예: `{ "text": "...", "highlights": [...] }` for note)
- `source_url` (string, nullable) - 수집된 웹페이지 원본 URL
- `domain` (string, nullable) - `source_url`에서 추출한 도메인
- `ai_summary` (string, nullable) - AI가 생성한 1~3줄 요약
- `local_path` (string, nullable) - 로컬 파일과 연동된 경우의 파일 경로
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Folder**
- `id` (UUID, Primary Key)
- `user_id` (foreign key to User, not null)
- `parent_folder_id` (foreign key to Folder, nullable) - 폴더 계층 구조
- `name` (string)
- `type` (enum: `'user_created'`, `'category_root'`, `'local_sync'`) - 폴더 종류
- `category_type` (enum, nullable) - `category_root`일 경우의 콘텐츠 타입
- `color` (string, nullable) - 폴더 아이콘 색상
- `local_path` (string, nullable) - 로컬 폴더와 연동된 경우의 경로
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Tag**
- `id` (UUID, Primary Key)
- `user_id` (foreign key to User, not null)
- `name` (string, unique per user) - 태그 이름
- `color` (string, nullable) - 태그 색상
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Collaboration**
- `id` (UUID, Primary Key)
- `content_id` (foreign key to Content)
- `user_id` (foreign key to User) - 협업에 참여한 사용자
- `role` (enum: `'owner'`, `'editor'`, `'viewer'`) - 협업 역할
- `created_at` (timestamp)

**Content_Tag (Join Table)**
- `content_id` (foreign key to Content, Composite Primary Key)
- `tag_id` (foreign key to Tag, Composite Primary Key)

**Comment**
- `id` (UUID, Primary Key)
- `user_id` (foreign key to User)
- `content_id` (foreign key to Content) - 댓글이 달린 콘텐츠
- `parent_comment_id` (foreign key to Comment, nullable) - 대댓글 구조
- `text` (string)
- `created_at` (timestamp)

**UserSettings**
- `id` (UUID, Primary Key)
- `user_id` (foreign key to User, unique)
- `settings` (JSONB) - 모든 설정을 JSON으로 저장 (예: 단축키, 테마, 알림 설정)

---

## 3. 어떤 관계들이 존재하나요?
*각 엔터티 간의 관계를 정의하세요 (예: 일대다, 다대다 등). 가능하다면 ERD(엔터티 관계도)를 그려보세요.*

- **User & Content (1:N)**: 한 명의 `User`는 여러 개의 `Content`를 소유합니다.
- **User & Folder (1:N)**: 한 명의 `User`는 여러 개의 `Folder`를 생성하고 소유합니다.
- **User & Tag (1:N)**: 한 명의 `User`는 여러 개의 `Tag`를 생성합니다.
- **User & UserSettings (1:1)**: 한 명의 `User`는 하나의 `UserSettings`를 가집니다.
- **Folder & Content (1:N)**: 하나의 `Folder`는 여러 `Content`를 포함할 수 있으며, `Content`는 `Folder`에 속하지 않을 수도 있습니다.
- **Folder & Folder (1:N, self-referencing)**: `parent_folder_id`를 통해 폴더는 무한한 깊이의 계층 구조를 가질 수 있습니다.
- **Content & Tag (N:M)**: `Content_Tag` Join 테이블을 통해 하나의 `Content`는 여러 `Tag`를, 하나의 `Tag`는 여러 `Content`에 연결될 수 있습니다.
- **Content & User (Collaboration, N:M)**: `Collaboration` Join 테이블을 통해 `Content`는 여러 `User`와 공유될 수 있으며, `role`에 따라 권한이 달라집니다.
- **Content & Comment (1:N)**: 하나의 `Content`는 여러 개의 `Comment`를 가질 수 있습니다.

---

## 4. 어떤 CRUD 작업이 필요한가요?
*각 엔터티에 대해 Create, Read, Update, Delete 중 어떤 작업이 필요한지, 그리고 누가 수행할 수 있는지를 시나리오 중심으로 정의하세요.*

- **콘텐츠 수집 및 관리**
    - **Create**: 사용자가 단축키, 드래그앤드롭으로 `Content`를 생성합니다.
    - **Read**: 사용자는 폴더, 태그, 검색을 통해 `Content` 목록을 조회합니다. 협업자는 공유된 `Content`를 조회할 수 있습니다.
    - **Update**: `Content`의 소유자나 `editor` 권한을 가진 협업자가 `Content`의 `data`, `title` 등을 수정합니다.
    - **Delete**: `Content`의 소유자만 `Content`를 삭제할 수 있습니다.

- **폴더 및 태그 관리**
    - **Create**: 사용자가 `Folder`나 `Tag`를 생성합니다.
    - **Read**: 사용자는 자신의 `Folder` 계층 구조와 `Tag` 목록을 조회합니다.
    - **Update**: 사용자가 `Folder`나 `Tag`의 이름, 색상 등을 수정합니다.
    - **Delete**: 사용자가 자신이 만든 `Folder`나 `Tag`를 삭제합니다.

- **실시간 협업 및 커뮤니케이션**
    - **Create**: `Content` 소유자가 다른 사용자를 `Collaboration`에 초대합니다. `editor` 이상의 협업자는 `Comment`를 작성합니다.
    - **Read**: `Collaboration` 참여자들은 공유된 `Content`와 `Comment`를 실시간으로 읽습니다.
    - **Update**: `Content` 소유자가 협업자의 `role`을 변경합니다. `Comment` 작성자는 자신의 댓글을 수정할 수 있습니다.
    - **Delete**: `Content` 소유자가 협업자를 내보내거나, `Comment` 작성자가 자신의 댓글을 삭제합니다.

---

## 5. 어떤 규칙이나 제약이 존재하나요?
*비즈니스 규칙, 입력값 유효성 검증, 데이터 무결성 제약 조건 등을 상세히 작성하세요.*

- **권한 및 접근 제어**
    - `Content`의 모든 CRUD 권한은 기본적으로 소유자(`owner`)에게 있습니다.
    - 협업자(`editor`, `viewer`)의 권한은 `Collaboration`의 `role`에 의해 엄격히 통제됩니다.
    - `editor`는 `Content` 수정 및 `Comment` 작성이 가능하지만, `Content` 삭제나 다른 협업자 초대는 불가능합니다.
    - `viewer`는 읽기만 가능합니다.

- **데이터 무결성 및 제약 조건**
    - 사용자가 탈퇴하면, 해당 사용자가 소유한 모든 데이터(Content, Folder 등)는 정책에 따라 논리적 삭제(soft-delete) 또는 물리적 삭제(hard-delete) 처리됩니다.
    - 협업 중인 `Content`의 소유자가 탈퇴할 경우, 소유권 이전 또는 콘텐츠 아카이빙 등의 처리 정책이 필요합니다.
    - `Folder` 삭제 시, 내부에 포함된 `Content`들은 삭제되지 않고 `folder_id`가 `null`로 변경되어 '미분류' 상태가 됩니다.

- **핵심 비즈니스 로직**
    - **검색**: Elasticsearch를 활용하여 `Content`의 `title`, `data`(텍스트), `ai_summary` 및 연결된 `Tag`의 `name`을 대상으로 전문(full-text) 및 유의어 검색을 지원합니다.
    - **Post-it 모드**: 특정 `Content`(`note` 타입)를 별도의 창으로 띄우는 기능으로, 이 창의 위치와 크기는 `UserSettings`에 저장될 수 있습니다.

- **AI 처리 규칙**
    - `Content` 생성 시 AI 요약 및 키워드 추출 작업은 사용자 경험을 해치지 않도록 반드시 비동기(asynchronous)로 처리되어야 합니다.
    - AI 어시스턴트와의 대화는 해당 사용자가 접근 권한을 가진 `Content`만을 RAG의 소스로 사용해야 합니다.

- **동기화 규칙**
    - `type`이 `local_sync`인 `Folder`는 지정된 로컬 디렉토리와 실시간으로 파일 목록을 동기화해야 합니다. (파일 생성/수정/삭제 감지)
    - `Collaboration`이 활성화된 `Content`와 관련 `Comment`는 Supabase Realtime을 사용하여 모든 참여자에게 변경 사항이 실시간으로 전파되어야 합니다.

