# 데모 UI 개발 전략

데모 페이지는 기능을 보여주는 곳이다. 사용자가 빠르게 이해하고 테스트할 수 있어야 한다. 불필요한 장식이나 설명을 배제한다.

## 공통 헤더

모든 페이지는 `SimpleTitlebar`로 시작한다. 데모 버튼 하나만 있고, 윈도우 컨트롤 버튼(최소화/최대화/닫기)이 있다.

```tsx
import { SimpleTitlebar } from '@/app/layout/components/SimpleTitlebar';

export const MyDemo: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <SimpleTitlebar />

      {/* 데모 콘텐츠 */}
      <div className="flex-1 bg-gray-50 p-6">
        {/* ... */}
      </div>
    </div>
  );
};
```

헤더는 모든 페이지에서 동일하다. 데모 버튼을 클릭하면 데모 목록으로 이동한다.

## 달랑 원칙

핵심만 담는다. 군더더기를 없앤다.

데모에 들어가는 것:
- 기능을 직접 테스트할 수 있는 버튼
- 현재 상태를 보여주는 시각적 요소
- 필수적인 설명 (한 줄)

데모에서 제외하는 것:
- 장황한 설명문
- 불필요한 애니메이션이나 장식
- 사용하지 않을 옵션이나 설정
- "달랑" 없어도 되는 모든 것

**나쁜 예**:
```tsx
<div className="fancy-container with-gradient and-shadow">
  <h2 className="animated-title">✨ Chrome Tabs 기능 소개 ✨</h2>
  <p className="long-description">
    이 데모는 Chrome 브라우저의 탭 시스템을 완벽하게 재현한 것입니다.
    Chrome은 전 세계에서 가장 많이 사용되는 브라우저로...
  </p>
  <Button>탭 추가하기 (클릭하면 새로운 탭이 생성됩니다)</Button>
</div>
```

**좋은 예**:
```tsx
<div>
  <ChromeTabs onNewTab={handleNewTab} />
  <Button onClick={() => addTab('Google')}>Google</Button>
  <Button onClick={() => addTab('GitHub')}>GitHub</Button>
</div>
```

## Writing Style - 서술형으로 흐르게

라벨과 강조를 최소화한다. 자연스럽게 읽히도록 쓴다.

**나쁜 예**:
```tsx
<div>
  <strong>애니메이션 타이밍:</strong> 167ms
  <br />
  <strong>Easing:</strong> ease-out
  <br />
  <strong>투명도:</strong> 0.75
</div>
```

**좋은 예**:
```tsx
<div>
  드래그 중 다른 탭들이 167ms 동안 부드럽게 이동한다.
  ease-out easing으로 자연스러운 감속을 만들고,
  드래그 중인 탭은 0.75 투명도로 표시된다.
</div>
```

리스트가 필요한 경우에만 사용한다. 설명이 필요하면 서술형으로 쓴다.

**리스트 사용 (나쁨)**:
```tsx
<h3>Chrome 탭 특징</h3>
<ul>
  <li>실시간 드래그앤드롭</li>
  <li>167ms 애니메이션</li>
  <li>Tab center 알고리즘</li>
</ul>
```

**서술형 사용 (좋음)**:
```tsx
<p>
  Chrome 탭은 드래그하는 동안 다른 탭들이 실시간으로 공간을 만든다.
  167ms 애니메이션으로 부드럽게 이동하고,
  탭의 중심점을 기준으로 드롭 위치를 결정한다.
</p>
```

## 버튼과 컨트롤

버튼은 기능을 명확히 표현한다. 불필요한 설명을 추가하지 않는다.

**나쁜 예**:
```tsx
<Button>
  새 탭 추가 (이 버튼을 클릭하면 새로운 탭이 생성됩니다)
</Button>
<Button>
  모든 탭 닫기 (주의: 이 작업은 되돌릴 수 없습니다!)
</Button>
```

**좋은 예**:
```tsx
<Button>새 탭</Button>
<Button>모든 탭 닫기</Button>
```

버튼 텍스트만으로 충분하다. 추가 설명이 필요하면 사용자가 이해 못 하는 기능이다.

## 레이아웃

화면을 논리적으로 나눈다. 과도한 구분선이나 박스를 사용하지 않는다.

**원칙**:
- 기능 자체가 먼저 보여야 함 (상단)
- 테스트 버튼은 그 다음 (중단)
- 기술 정보는 필요시에만 (하단)

**나쁜 예**:
```tsx
<div className="border rounded shadow p-6 mb-4 bg-gradient">
  <div className="border-b pb-4 mb-4">
    <h2 className="text-xl font-bold border-l-4 border-blue-500 pl-4">
      Chrome 탭 시스템
    </h2>
  </div>
  <div className="border rounded p-4 bg-white">
    <ChromeTabs />
  </div>
</div>
```

**좋은 예**:
```tsx
<div>
  <ChromeTabs />
  <div className="mt-4">
    <Button>Google</Button>
    <Button>GitHub</Button>
  </div>
</div>
```

## 기술 정보 표시

숫자나 기술 상수를 보여줄 때는 간결하게. 코드가 설명이다.

**나쁜 예**:
```tsx
<div className="info-box">
  <h3>Chrome 애니메이션 상수 값들</h3>
  <table>
    <tr>
      <td>드래그 애니메이션 시간</td>
      <td>167밀리초</td>
      <td>Chrome 브라우저와 동일한 값</td>
    </tr>
  </table>
</div>
```

**좋은 예**:
```tsx
<div>
  <code>167ms</code> 드래그 애니메이션
  <code>0.75</code> 투명도
</div>
```

또는 더 간단하게:
```tsx
드래그 중 다른 탭들이 167ms로 이동한다.
```

## 실전 체크리스트

데모 페이지 만들 때 확인할 것:

**필수**:
- 기능이 즉시 보이는가?
- 버튼 클릭만으로 테스트 가능한가?
- 모든 텍스트가 필수적인가?

**제거**:
- 장황한 설명문 있나?
- 불필요한 라벨이나 강조 있나?
- 사용 안 할 옵션이나 설정 있나?
- 과도한 박스나 구분선 있나?

**개선**:
- 리스트를 서술형으로 바꿀 수 있나?
- 버튼 텍스트가 너무 긴가?
- 레이아웃이 복잡한가?

## 결론

데모는 기능을 보여주는 곳이다. 설명서가 아니다. 사용자가 직접 테스트하면서 이해한다. 텍스트는 최소한으로. 버튼과 인터랙션이 핵심이다.

"달랑" 이것만 있으면 된다는 마음으로 만든다. 하나 추가할 때마다 정말 필요한지 자문한다. 대부분은 필요 없다.
