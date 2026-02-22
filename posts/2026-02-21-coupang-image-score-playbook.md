# 쿠팡 이미지 스코어 올리는 실전 가이드 (2026-02-21 기준)

쿠팡에서 말하는 "이미지 스코어"는 공개된 단일 점수 공식이 있는 형태라기보다, 실제 운영에서는 **이미지 검수 통과율 + 클릭률(CTR) + 전환율(CVR)**로 체감됩니다.
즉, 이미지는 "예쁘게 만드는 작업"이 아니라 **노출과 매출을 동시에 올리는 운영 지표**입니다.

2026년 2월 21일 기준으로 공개된 쿠팡 마켓플레이스 상품등록 안내에서 확인 가능한 핵심 규격은 아래와 같습니다.

- 최소 크기: 100x100px
- 권장 크기: 500x500px
- 파일 용량: 5MB 이하
- 형식: JPG, PNG
- 추가 이미지: 최대 9개
- 비정사각형 이미지는 플랫폼에서 비율이 조정될 수 있음
- 등록 이미지는 쿠팡 기준에 맞게 변경될 수 있음

![쿠팡 이미지 스코어 핵심](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9Iuy/oO2MoSDsnbTrr7jsp4Ag7Iqk7L2U7Ja0IO2VteyLrCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwRjE3MkEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMUQ0RUQ4Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIGZpbGw9InVybCgjYmcpIi8+CiAgPHJlY3QgeD0iNTIiIHk9IjU2IiB3aWR0aD0iMTA5NiIgaGVpZ2h0PSI1NjMiIHJ4PSIyOCIgZmlsbD0iIzBCMTIyMCIgZmlsbC1vcGFjaXR5PSIwLjc2Ii8+CiAgPHRleHQgeD0iODgiIHk9IjE0OCIgZmlsbD0iI0Y4RkFGQyIgZm9udC1zaXplPSI1MiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj7sv6DtjKEg7J2066+47KeAIOyKpOy9lOyWtCDtlbXsi6w8L3RleHQ+CiAgPHRleHQgeD0iODgiIHk9IjIxMCIgZmlsbD0iI0E5QkNENCIgZm9udC1zaXplPSIzNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj7qsoDsiJgg7Ya16rO8ICsg7YG066at66WgICsg7KCE7ZmY7JyoPC90ZXh0PgogIDx0ZXh0IHg9Ijg4IiB5PSIyNzAiIGZpbGw9IiNEREU3RjMiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+LSDqt5zqsqkg7Ya16rO8OiA1MDB4NTAwIOq2jOyepSwgNU1CIOydtO2VmDwvdGV4dD4KICA8dGV4dCB4PSI4OCIgeT0iMzIyIiBmaWxsPSIjRERFN0YzIiBmb250LXNpemU9IjMwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPi0g64yA7ZGc7J2066+47KeAOiDsoJztkogg7KSR7IusLCDtlZzriIjsl5Ag7J207ZW0PC90ZXh0PgogIDx0ZXh0IHg9Ijg4IiB5PSIzNzQiIGZpbGw9IiNEREU3RjMiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+LSDstpTqsIDsnbTrr7jsp4A6IOq1rOunpCDrtojslYgg7ZW07IaMIOyInOyEnCDqtazshLE8L3RleHQ+Cjwvc3ZnPg==)

## 1. 먼저 해야 할 진단: "이미지 문제 SKU"를 분리

전체 상품을 한 번에 손보면 시간만 쓰고 성과가 안 납니다. 먼저 14일 데이터를 기준으로 SKU를 3그룹으로 나누세요.

- A그룹: 노출은 높은데 CTR 낮음 -> 대표이미지 우선 개선
- B그룹: CTR은 괜찮은데 CVR 낮음 -> 추가이미지/상세페이지 개선
- C그룹: 노출 자체가 낮음 -> 키워드/카테고리/가격 먼저 점검

권장 컷(실무 시작점):

- CTR 1.5% 미만: 대표이미지 교체 대상
- CVR 1.0% 미만(카테고리 평균 대비): 추가이미지 보강 대상

## 2. 대표이미지에서 점수가 갈리는 6가지

대표이미지는 검색 결과에서 1초 안에 선택을 받는 요소입니다. 아래 6개를 강제 기준으로 잡으면 CTR이 가장 빨리 개선됩니다.

![대표이미지 개선 체크](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IuuMgO2RnOydtOuvuOyngCDqsJzshKAg7LK07YGsIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzA1MkUyQiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwRTc0OTAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgZmlsbD0idXJsKCNiZykiLz4KICA8cmVjdCB4PSI1MiIgeT0iNTYiIHdpZHRoPSIxMDk2IiBoZWlnaHQ9IjU2MyIgcng9IjI4IiBmaWxsPSIjMEIxMjIwIiBmaWxsLW9wYWNpdHk9IjAuNzYiLz4KICA8dGV4dCB4PSI4OCIgeT0iMTQ4IiBmaWxsPSIjRjhGQUZDIiBmb250LXNpemU9IjUyIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPuuMgO2RnOydtOuvuOyngCDqsJzshKAg7LK07YGsPC90ZXh0PgogIDx0ZXh0IHg9Ijg4IiB5PSIyMTAiIGZpbGw9IiNBOUJDRDQiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+7LKrIO2BtOumreydhCDrp4zrk5zripQg7I2464Sk7J28IOq1rOyhsDwvdGV4dD4KICA8dGV4dCB4PSI4OCIgeT0iMjcwIiBmaWxsPSIjRERFN0YzIiBmb250LXNpemU9IjMwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPi0g7KCc7ZKIIOuptOyggSA3NX45MCUg7ZmV67O0PC90ZXh0PgogIDx0ZXh0IHg9Ijg4IiB5PSIzMjIiIGZpbGw9IiNEREU3RjMiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+LSDrsLDqsr0v7IaM7ZKIIOy1nOyGjO2ZlOuhnCDsi5zshKAg7KeR7KSRPC90ZXh0PgogIDx0ZXh0IHg9Ijg4IiB5PSIzNzQiIGZpbGw9IiNEREU3RjMiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+LSDsmLXshZjrqoUt7J2066+47KeAIOu2iOydvOy5mCDsponsi5wg7IiY7KCVPC90ZXh0Pgo8L3N2Zz4=)

1. 정사각형 캔버스(최소 500x500, 가능하면 1000x1000 이상 원본)로 제작
2. 제품이 화면의 75~90%를 차지하도록 크롭
3. 배경/소품/장식 최소화(제품 식별이 최우선)
4. 옵션(색상/수량/규격)과 대표이미지 실제 노출이 1:1로 일치
5. 흐림/노이즈/압축 깨짐이 있는 도매 원본 이미지는 교체
6. 경쟁 썸네일과 나란히 봤을 때 "무엇을 파는지" 1초 내 이해 가능하게 설계

## 3. 추가이미지 9장 구성법: 구매 불안을 없애는 순서

추가이미지는 예쁜 순서가 아니라 **의심 해소 순서**로 구성해야 전환율이 올라갑니다.

1. 핵심 효익 요약(이 제품이 해결하는 문제)
2. 사이즈/치수/호환 규격
3. 구성품(포함/미포함 명확화)
4. 사용 장면(실사용 맥락)
5. 디테일 확대(재질, 마감, 두께)
6. 사용 방법 3스텝
7. 세탁/보관/주의사항
8. 교환/반품 전 자주 묻는 오해 방지 정보
9. 옵션별 차이 요약

## 4. "이미지 스코어"를 올리는 교체 방식: 7일 A/B 루틴

동시에 두 이미지를 올려 비교할 수 없으므로, 기간 분리 테스트로 진행합니다.

![7일 A/B 테스트 루틴](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IjfsnbwgQS9CIO2FjOyKpO2KuCDro6jti7QiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM0IxRDJFIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzdDM0FFRCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjc1IiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHg9IjUyIiB5PSI1NiIgd2lkdGg9IjEwOTYiIGhlaWdodD0iNTYzIiByeD0iMjgiIGZpbGw9IiMwQjEyMjAiIGZpbGwtb3BhY2l0eT0iMC43NiIvPgogIDx0ZXh0IHg9Ijg4IiB5PSIxNDgiIGZpbGw9IiNGOEZBRkMiIGZvbnQtc2l6ZT0iNTIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCI+N+ydvCBBL0Ig7YWM7Iqk7Yq4IOujqO2LtDwvdGV4dD4KICA8dGV4dCB4PSI4OCIgeT0iMjEwIiBmaWxsPSIjQTlCQ0Q0IiBmb250LXNpemU9IjM0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPuqwkOydtCDslYTri4jrnbwg642w7J207YSw66GcIOq1kOyytCDtjJDri6g8L3RleHQ+CiAgPHRleHQgeD0iODgiIHk9IjI3MCIgZmlsbD0iI0RERTdGMyIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj4tIEHslYggN+ydvCAtJmd0OyBC7JWIIDfsnbwg64+Z7J28IOyhsOqxtDwvdGV4dD4KICA8dGV4dCB4PSI4OCIgeT0iMzIyIiBmaWxsPSIjRERFN0YzIiBmb250LXNpemU9IjMwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPi0gQ1RSICsyMCUg7J207IOB7J2066m0IOycoOyngCDtm4Trs7Q8L3RleHQ+CiAgPHRleHQgeD0iODgiIHk9IjM3NCIgZmlsbD0iI0RERTdGMyIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj4tIENWUi/rsJjtkojrpaAg6rCZ7J20IOuztOqzoCDstZzsooUg7ZmV7KCVPC90ZXh0Pgo8L3N2Zz4=)

1. A안 대표이미지 7일 운영(가격/쿠폰/광고 조건 고정)
2. B안 대표이미지 7일 운영(다른 변수 동일)
3. CTR, CVR, 반품률, 문의 건수 비교

교체 판단 기준(권장):

- CTR +20% 이상 개선
- CVR 하락이 없거나 +5% 이상 개선
- 반품률/문의 증가가 없을 것

세 지표를 동시에 만족하는 이미지가 "승자 이미지"입니다.

## 5. 점수 하락을 막는 운영 규칙

- 옵션 추가/변경 시 이미지도 같은 날 수정
- 공급처 이미지 바뀌면 기존 상세와 불일치 여부 즉시 점검
- 품절 직전 상품에 오해 유발 이미지(구성 과장) 사용 금지
- 시즌성 상품은 시즌 시작 2~3주 전에 대표이미지 선교체
- CS에서 반복되는 질문은 다음 이미지 개편 때 바로 반영

## 6. 주간 운영 대시보드(이미지 중심)

매주 아래 숫자만 보면 이미지 개선 우선순위가 바로 정해집니다.

- 노출수
- CTR
- CVR
- 장바구니 전환율
- 반품률
- 문의율(주문 100건당 문의 수)

실행 규칙:

- CTR 하위 20% SKU: 대표이미지 우선 교체
- CVR 하위 20% SKU: 추가이미지 2~4번 구간 보강
- 반품률 상위 SKU: 구성/사이즈 고지 이미지를 최상단으로 이동

## 바로 실행용 체크리스트

- 오늘: CTR 하위 SKU 20개 추출
- 내일: 대표이미지 2안씩 제작
- 3일차: A/B 1차 배포
- 10일차: 승자 이미지 확정 + 패자 이미지 폐기
- 14일차: 추가이미지 순서 재배열 + 2차 테스트 시작

핵심은 한 번에 완성하는 것이 아니라, **2주 단위로 이미지를 업데이트하고 지표로 생존시킬 이미지만 남기는 것**입니다.
