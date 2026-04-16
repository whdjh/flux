- **레이아웃**
    - `flex`: Flex 컨테이너로 설정
    - `flex-col`: Flex 방향을 세로로 설정
    - `flex-1`: Flex 아이템이 남은 공간을 모두 차지하도록 설정
- **정렬**
    - `items-center`: 수직 정렬을 가운데로
    - `justify-between`: 수평 정렬을 양 끝으로
- **크기**
    - `h-16`, `w-60`: 높이와 너비를 설정 (단위: 1단위 = 0.25rem)
- **패딩 및 마진**
    - `p-4`, `px-4`, `py-2`: 패딩 설정
    - `m-4`, `mx-4`, `my-2`: 마진 설정
- **색상**
    - `bg-[색상명]`: 배경색 설정
    - `text-[색상명]`: 텍스트 색상 설정
- **타이포그래피**
    - `text-xl`, `font-bold`: 글자 크기 및 굵기 설정
- **기타**
    - `rounded`: 모서리를 둥글게
    - `focus:outline-none`: 포커스 시 아웃라인 제거

## **커스텀 테마**
uno.config.ts 파일에서 커스텀 색상 설정.
```css
<header className="h-16 flex items-center justify-between px-4 bg-header text-foreground">
  {/* 내용 */}
</header>
```
- `bg-header`: 설정 파일에서 정의한 `header` 색상을 배경색으로 사용합니다.
- `text-foreground`: 설정 파일에서 정의한 `foreground` 색상을 텍스트 색상으로 사용합니다.

## **반응형**
UnoCSS는 반응형 디자인을 위한 프리픽스를 제공합니다.
```css
<div className="flex flex-col md:flex-row">
  {/* 작은 화면에서는 세로 배치, 중간 화면 이상에서는 가로 배치 */}
</div>```
- `md:`: 중간 크기 화면 이상에서만 해당 스타일을 적용합니다.
- 기본 브레이크포인트는 아래와 같습니다:
    - `sm`: 640px 이상
    - `md`: 768px 이상
    - `lg`: 1024px 이상
    - `xl`: 1280px 이상



네, 이해합니다. UnoCSS의 기본 유틸리티 클래스를 찾는 것이 처음에는 어려울 수 있습니다. 다행히도 UnoCSS는 Tailwind CSS와 매우 유사한 클래스 이름을 사용하므로, Tailwind CSS 문서를 참조할 수 있습니다.

1. UnoCSS 공식 문서:
   https://unocss.dev/interactive/
   이 페이지에서 사용 가능한 클래스를 검색하고 미리보기할 수 있습니다.

주요 카테고리별 자주 사용되는 클래스 예시:

1. 레이아웃:
   - `flex`, `grid`, `block`, `inline-block`
   - `w-{size}`, `h-{size}` (예: `w-full`, `h-screen`)
   - `p-{size}`, `m-{size}` (예: `p-4`, `m-2`)

2. 타이포그래피:
   - `text-{size}` (예: `text-sm`, `text-2xl`)
   - `font-{weight}` (예: `font-bold`, `font-normal`)
   - `text-{color}` (예: `text-blue-500`, `text-gray-700`)

3. 배경:
   - `bg-{color}` (예: `bg-red-200`, `bg-gray-100`)

4. 테두리:
   - `border`, `border-{size}`, `border-{color}`
   - `rounded`, `rounded-{size}` (예: `rounded-lg`, `rounded-full`)

5. Flexbox:
   - `flex`, `flex-col`, `items-center`, `justify-between`

6. Grid:
   - `grid`, `grid-cols-{number}`, `col-span-{number}`

7. 간격:
   - `space-x-{size}`, `space-y-{size}`

8. 크기:
   - `w-{fraction}` (예: `w-1/2`, `w-1/3`)
   - `max-w-{size}`, `min-h-{size}`

9. 위치:
   - `absolute`, `relative`, `fixed`
   - `top-{size}`, `left-{size}`, `bottom-{size}`, `right-{size}`


1. 레이아웃
   - `block`, `inline`, `inline-block`, `flex`, `grid`
   - `hidden`, `visible`
   - `container`

2. Flexbox & Grid
   - `flex-row`, `flex-col`, `flex-wrap`
   - `justify-start`, `justify-center`, `justify-between`
   - `items-start`, `items-center`, `items-stretch`
   - `grid-cols-{1-12}`, `grid-rows-{1-6}`
   - `gap-{size}`
   - `grid-rows-[auto_1fr_auto]`

3. 간격 (Spacing)
   - `m-{size}`, `mx-{size}`, `my-{size}`, `mt-{size}`, `mr-{size}`, `mb-{size}`, `ml-{size}`
   - `p-{size}`, `px-{size}`, `py-{size}`, `pt-{size}`, `pr-{size}`, `pb-{size}`, `pl-{size}`

4. 크기 (Sizing)
   - `w-{size}`, `h-{size}`
   - `min-w-{size}`, `min-h-{size}`
   - `max-w-{size}`, `max-h-{size}`

5. 타이포그래피
   - `text-{size}` (예: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`)
   - `font-{weight}` (예: `font-normal`, `font-medium`, `font-bold`)
   - `text-left`, `text-center`, `text-right`
   - `uppercase`, `lowercase`, `capitalize`

6. 배경
   - `bg-{color}` (예: `bg-red-500`, `bg-blue-200`)
   - `bg-opacity-{value}`

7. 테두리
   - `border`, `border-{size}`
   - `border-{color}`
   - `rounded`, `rounded-{size}`, `rounded-full`

8. 효과
   - `shadow-{size}`, `shadow-{color}`
   - `opacity-{value}`

9. 전환 & 변환
   - `transition`, `transition-{property}`
   - `duration-{time}`
   - `scale-{value}`, `rotate-{degree}`, `translate-x-{value}`, `translate-y-{value}`

10. 인터랙티브
    - `hover:`, `focus:`, `active:` (예: `hover:bg-blue-600`)
    - `cursor-pointer`, `cursor-not-allowed`

11. Z-index
    - `z-{value}` (예: `z-10`, `z-50`)

