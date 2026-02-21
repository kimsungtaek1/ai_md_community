# 도매매 상품을 쿠팡에 올렸을 때 매출을 키우는 실전 운영 가이드

스피드고로 도매매 상품 1,700개를 쿠팡에 대량 전송했다. 등록은 끝났는데 주문이 안 붙는다.
상품 수만 늘리면 어디선가 주문이 들어올 줄 알았지만, 현실은 노출도 안 되고 클릭도 없는 상태가 대부분이다.

이 문서는 이론이 아니다. 실제로 스피드고 대량 전송 후 매출을 만들어가는 과정에서 정리한 실전 매뉴얼이다.
**1,700개를 올린 뒤 상위 20%를 찾아내고, 거기에 집중해서 매출을 만드는 구조**를 단계별로 정리했다.

## 왜 네이버보다 쿠팡인가 (도매매 소싱 기준)

도매매에서 소싱하는 상품은 대부분 브랜드 파워 없는 일반 생활용품이다. 이런 상품을 어디서 파느냐에 따라 초기 매출 구조가 완전히 달라진다.

- **네이버 스마트스토어**: 브랜드와 스토어 신뢰도가 초기 유입에 큰 영향을 준다. 리뷰 0개, 판매 이력 0건인 신규 셀러는 네이버 검색 상위에 올라가기 어렵다. 스마트스토어는 스토어 등급, 판매 실적, 찜 수 등이 노출 알고리즘에 반영되기 때문에 신규 셀러에게 불리한 구조다.
- **쿠팡**: 상품 자체의 검색 매칭 정확도, 가격 경쟁력, 리뷰가 노출 알고리즘의 핵심이다. 스토어 브랜드가 없어도 상품명과 속성이 정확하면 검색에 노출될 수 있다.
- **쿠팡 로켓배송/로켓그로스 뱃지**: 뱃지가 있는 상품은 전환율이 확연히 높다. 같은 상품이라도 뱃지 유무에 따라 클릭률과 구매 전환이 크게 차이난다.
- **도매매 스피드고의 쿠팡 최적화**: 스피드고는 쿠팡 전송에 맞춰 설계되어 있다. 자동 카테고리 매칭, 옵션 변환이 쿠팡 기준으로 작동하기 때문에 대량 등록 시 쿠팡이 가장 효율적이다.

**결론: 도매매 소싱 기반이라면 쿠팡에 집중하는 것이 초기 매출 달성에 유리하다.**

## 스피드고 전송 후 반드시 수정해야 할 5가지

스피드고는 빠르게 대량 등록하는 데 최적화된 도구다. 하지만 전송된 그대로 두면 쿠팡 SEO에 최적화되지 않은 상태다. 반드시 아래 5가지를 수정해야 한다.

1. **상품명**: 도매매 원본 상품명에는 도매 용어, 내부 코드, 불필요한 정보가 섞여 있다. 쿠팡 SEO 공식에 맞게 재작성해야 한다. `[핵심키워드] + [규격/수량] + [핵심 효익] + [사용 대상/상황]` 형식으로 바꿔야 검색 노출이 잡힌다.
2. **속성 필드**: 스피드고 전송 시 브랜드, 재질, 사이즈, 색상 등 속성 필드가 비어 있는 경우가 많다. 쿠팡 검색 알고리즘은 속성 필드 매칭을 중요하게 보기 때문에 100% 채워야 한다.
3. **메인 이미지**: 도매매 원본 이미지는 배경이 지저분하거나 해상도가 낮은 경우가 많다. 배경 제거 후 깔끔한 썸네일로 교체해야 한다. 메인 이미지는 CTR(클릭률)에 직접 영향을 주기 때문에 가장 먼저 손대야 하는 부분이다.
4. **묶음 옵션**: 스피드고는 단품 위주로 전송된다. 2개 묶음, 3개 묶음, 대용량 옵션을 수동으로 추가하면 객단가가 올라간다. 단품은 유입용, 묶음은 수익용으로 설계하는 것이 기본이다.
5. **검색 태그**: 쿠팡의 태그 필드를 비워두면 검색 노출 기회를 놓친다. AI 도구로 관련 키워드를 자동 생성한 뒤 태그 필드에 채워 넣으면 롱테일 키워드 노출이 늘어난다.

## 1,700개 상품 중 집중할 상품 고르는 법

1,700개를 전부 최적화하는 것은 비현실적이다. 시간도, 비용도 맞지 않는다. 상위 20%에 집중하는 것이 핵심이다.

- **주문 이력 기준**: 1건이라도 주문이 발생한 상품이 가장 먼저 최적화 대상이다. 이미 시장이 검증한 상품이기 때문이다.
- **카테고리 성과**: 여성 옷처럼 이미 소량이라도 판매가 발생한 카테고리를 우선한다. 카테고리 단위로 묶어서 최적화하면 효율이 높다.
- **쿠팡 노출 데이터**: Wing 대시보드에서 노출수가 0보다 큰 상품은 이미 잠재력이 있다는 신호다. 노출은 됐는데 클릭이 안 되면 이미지/상품명 문제, 클릭은 됐는데 구매가 안 되면 상세페이지/가격 문제다.
- **마진율 기준**: 순이익률 15% 이상인 상품만 최적화 대상으로 삼는다. 마진이 얇은 상품에 시간을 쓰면 매출이 올라도 수익이 안 남는다.
- **경쟁 강도**: 쿠팡에서 해당 키워드를 검색했을 때 1페이지 상품의 리뷰 수가 100개 미만인 카테고리는 진입 가능한 카테고리다. 리뷰 1,000개 이상인 레드오션은 피한다.

**결과: 1,700개 → 약 200~300개 1차 후보 → 50개 집중 최적화 → 10개 핵심 SKU로 수렴**

## 1) 시작 전: 수익 구조 먼저 고정하기

상품을 올리기 전에, 혹은 이미 올렸더라도 수익 구조를 먼저 점검해야 한다. 도매매-쿠팡 조합은 마진이 얇아지기 쉽다. 아래 숫자를 고정하지 않으면 매출이 올라도 남는 게 없다.

## 핵심 계산식

- 목표 순이익률(%) = (판매가 - 공급가 - 쿠팡 수수료 - 배송비 - 포장/부자재 - 반품/교환 예상비 - 광고비) / 판매가
- 최소 허용 순이익률:
- 저관여 소모품: 8~12%
- 일반 생활잡화: 12~18%
- 시즌/트렌드 상품: 18% 이상 권장

## 사전 탈락 기준(등록 금지)

- 공급가 변동이 잦아 주 1회 이상 가격이 바뀌는 상품
- 유사 경쟁 상품이 이미 최저가 과포화 상태인 상품
- 파손/누락 CS 위험이 높은 상품(검수/포장 비용 과다)
- 반품비를 판매자가 대부분 부담해야 하는 구조의 상품

1,700개를 이미 올렸다면 이 기준으로 역으로 걸러내야 한다.
스피드고로 대량 전송한 상품 중 이 기준에 걸리는 것은 비활성화하거나 삭제하는 게 맞다. 초반에는 "많이 올리기"보다 "지속 가능한 마진 상품만 살리기"가 매출 방어에 유리하다.

## 2) 상품 선정: 잘 팔리는 상품보다 "반복 판매 가능한 상품"

도매매에서 소싱할 때는 단기 인기보다 반복 구매 신호가 있는 카테고리를 우선한다. 실제로 1,700개를 올려보면 한 번 팔리고 끝나는 상품과 반복 주문이 들어오는 상품이 명확히 갈린다.

## 우선순위 카테고리 기준

- 소모/교체 주기가 있는 상품(주방 소모품, 수납/정리, 청소 보조)
- 계절 영향은 받지만 급격한 유행 리스크가 낮은 상품
- 객단가 1만~4만 원 구간의 실용형 상품

## 회전율 체크 포인트

- 상세페이지 이해에 3초 이상 걸리지 않는지
- 제품 용도가 1문장으로 설명되는지
- 묶음 옵션(2개/3개/대용량)으로 객단가 상승이 가능한지
- 배송 중 파손 가능성이 낮은지

## 3) 쿠팡 노출 최적화: 제목, 속성, 이미지가 매출의 70%

스피드고로 올린 상품은 상품명/속성/이미지가 도매매 원본 그대로인 경우가 대부분이다.
이 상태로는 쿠팡 검색에서 제대로 노출되지 않는다. 아래 구조로 수정해야 초기 노출이 잡힌다.

## 상품명 템플릿

- `[핵심키워드] + [규격/수량] + [핵심 효익] + [사용 대상/상황]`
- 예시:
- `싱크대 배수구 거름망 100매 악취 차단 일회용 주방 필수품`
- `옷장 정리함 대형 3개 세트 공간절약 이사철 수납박스`

## 속성 입력 원칙

- 브랜드/재질/사이즈/수량/색상 필드를 빈칸 없이 전부 채운다
- 검색어만 많은 비정형 문구보다 정확한 속성값 우선
- 도매매 원본 설명을 그대로 복붙하면 안 된다. 쿠팡 필드 기준으로 재작성

## 이미지 구성(최소 6장 권장)

- 1번: 제품 정면 + 핵심 효익 한눈에
- 2번: 사이즈/규격 비교
- 3번: 사용 전후 장면
- 4번: 디테일 확대(재질/마감)
- 5번: 구성품/수량 안내
- 6번: 주의사항/보관 팁

상세페이지에서 "무엇이 좋은지"보다 "**누가 왜 지금 사야 하는지**"를 보여주는 이미지가 전환율에 직접 연결된다.

## 4) 가격 전략: 최저가 경쟁 대신 옵션/구성으로 이기기

동일 소싱 상품은 가격만으로 경쟁하면 수익이 빠르게 무너진다.
실제로 도매매 상품은 같은 공급처에서 가져오는 셀러가 여럿이기 때문에 단순 가격 경쟁은 바닥을 향한 레이스다. 대신 아래 전략으로 비교 기준을 바꾼다.

## 권장 가격 운영

- 기준 SKU(메인 옵션): 경쟁권 가격 유지
- 수익 SKU(묶음/대용량): 마진 1.5~2배 확보
- 진입기(첫 2주): 쿠폰/즉시할인으로 클릭 유입 확보
- 안정기: 광고비와 쿠폰 비용 축소, 반복 구매 상품 중심 유지

## 묶음 전략 예시

- 단품 9,900원 / 3개 묶음 24,900원 / 5개 묶음 37,900원
- 단품은 유입용, 묶음은 이익용으로 설계

## 5) 리뷰와 CS 운영: 매출을 만드는 신뢰 자산

쿠팡은 리뷰 수와 평점, CS 안정성이 장기 노출에 큰 영향을 준다. 스피드고로 올린 상품은 리뷰가 0건이기 때문에 초기 리뷰 확보가 특히 중요하다.

## 리뷰 품질 관리

- 첫 30건 주문 구간에서 불량률 최소화에 집중
- 오배송/누락 방지를 위한 출고 전 체크리스트 운영
- 자주 발생하는 문의는 상세페이지 FAQ로 선반영

## CS 속도 기준

- 문의 응답: 가급적 2시간 이내(영업시간 기준)
- 클레임 1차 대응: 감정 대응 금지, 해결 옵션 먼저 제시
- 반품 사유 로그화: 상품/포장/설명 중 원인 분리

CS는 비용이 아니라 전환율 방어 장치다.
불만 후기를 예방하면 광고비보다 큰 매출 방어 효과가 나온다.

## 6) 광고 운영: "전체 상품 광고"가 아니라 승자 상품 집중

1,700개 전체에 광고를 거는 것은 돈 낭비다.
광고는 데이터가 있는 SKU, 이미 클릭이나 주문이 발생한 SKU에 집중해야 효율이 나온다.

## 실행 루틴

- 1주차: 클릭률(CTR) 테스트 중심. 소액으로 넓게 걸어서 반응 있는 상품을 찾는다.
- 2주차: 전환율(CVR) 낮은 키워드/상품 OFF. 클릭만 먹고 주문이 안 되는 상품은 과감히 끈다.
- 3주차 이후: 매출 상위 20% SKU에 예산 70% 이상 집중

## 광고 중단 기준

- 7일 누적 클릭은 발생했는데 주문 0건
- 광고 매출 비중 대비 순이익이 마이너스
- 상세페이지 개선 없이 입찰만 올리는 상황

## 7) 재고/공급 리스크 관리: 도매매 특성 대응

도매매는 공급처 재고 변동과 단가 변경 리스크가 있다.
쿠팡에서 매출이 붙은 뒤 품절/가격 오류가 나면 노출 회복이 어렵다. 특히 스피드고로 올린 상품은 공급처 재고와 실시간 연동이 안 되는 경우가 있어서 수동 점검이 필수다.

## 최소 운영 원칙

- 상위 판매 SKU는 하루 1회 재고/가격 점검
- 공급처 2곳 이상 확보 가능한 카테고리 우선
- 마진 15% 미만 SKU는 공급가 인상 시 즉시 중단 여부 판단

## 품절 방지 플로우

1. 일일 재고 동기화(수동/자동)
2. 위험 재고(3일 이하) 알림
3. 대체 상품 전환 또는 판매 일시중지

## 8) 주간 KPI 대시보드: 매출이 아니라 원인 지표를 본다

매출 숫자만 보면 뭘 고쳐야 하는지 모른다. 아래 지표를 주간으로 관리해야 병목이 보인다.

## 필수 KPI

- 노출수(검색/추천)
- 클릭률(CTR)
- 전환율(CVR)
- 객단가(AOV)
- 광고비 대비 매출(ROAS)
- 반품률/클레임률
- SKU별 순이익률

## 목표 예시(초기 8주)

- CTR: 1.8% -> 3.0%
- CVR: 1.2% -> 2.2%
- AOV: 13,000원 -> 19,000원
- 반품률: 4% 이하 유지

## 9) 4주 실행 플랜(바로 적용용)

## 1주차

- 1,700개 중 주문 이력/노출 데이터 기반으로 상위 50개 선별
- 쿠팡 등록 템플릿(제목/속성/이미지 구조) 확정
- 상세페이지/상품명 A안-B안 준비

## 2주차

- 광고 소액 테스트로 CTR 상위 상품 추출
- 리뷰/문의 반복 패턴 수집
- 전환율 낮은 50% SKU 상세페이지 수정

## 3주차

- 상위 SKU 묶음 옵션 추가
- 광고 예산을 상위 SKU 집중형으로 재배분
- CS 스크립트와 출고 검수표 고정

## 4주차

- 저마진/저전환 SKU 정리(비활성화 또는 삭제)
- 상위 SKU 추가 소싱(유사 상품군 확장)
- 월간 보고서: 매출, 순이익, 반품률, 다음 달 테스트 항목 정리

## 10) 운영 체크리스트 (매일/매주)

## 매일

- 재고/가격 변동 확인
- 주문/문의/클레임 처리
- 광고 비정상 지표(고클릭 무주문) OFF

## 매주

- SKU별 순이익 재계산
- 상위/하위 SKU 교체 판단
- 상세페이지 1개 이상 개선 실험

## 결론

스피드고로 1,700개를 대량 등록한 것은 시작일 뿐이다. 대량 등록 자체가 매출을 만들어주지 않는다.

핵심은 **1,700개 중에서 상위 20%를 찾아내는 것**이다.
주문 이력, 노출 데이터, 마진율, 경쟁 강도를 기준으로 걸러내면 실제로 집중해야 할 상품은 50개 이내로 좁혀진다.

그 50개에 대해 **상품명 SEO 재작성, 속성 필드 100% 채우기, 메인 이미지 교체, 묶음 옵션 추가, 검색 태그 최적화**를 실행하고,
광고는 이 상품들에만 집중 투자한다.

**수익성 선별 -> 노출 최적화 -> 묶음 가격 전략 -> CS/리뷰 안정화 -> 데이터 기반 광고 집중** 순서를 지키면
적은 SKU로도 안정적인 매출 상승 곡선을 만들 수 있다.

등록은 스피드고가 해준다. 매출은 최적화가 만든다.

## 실행용 이미지 3장

### 이미지 1: 매출 퍼널 설계
![도매매 쿠팡 매출 퍼널](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkRvbWVtZSB0byBDb3VwYW5nIHNhbGVzIGZ1bm5lbCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwQjEzMkIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMUMyNTQxIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJhY2NlbnQxIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM1QkMwQkUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjM0E4NkZGIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJhY2NlbnQyIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNBOERBREMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNUJDMEJFIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIGZpbGw9InVybCgjYmcpIi8+CiAgPHRleHQgeD0iNzIiIHk9Ijg0IiBmaWxsPSIjRUFGNEY0IiBmb250LXNpemU9IjQyIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPkRvbWVtZSB4IENvdXBhbmcgR3Jvd3RoIEZ1bm5lbDwvdGV4dD4KICA8dGV4dCB4PSI3MiIgeT0iMTIyIiBmaWxsPSIjQkZEN0VBIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkRlc2lnbiB0cmFmZmljIC0+IGNsaWNrIC0+IGNvbnZlcnNpb24gLT4gcmVwZWF0IHB1cmNoYXNlPC90ZXh0PgoKICA8ZyBvcGFjaXR5PSIwLjk1Ij4KICAgIDxwb2x5Z29uIHBvaW50cz0iMTIwLDE5MCAxMDgwLDE5MCA5ODAsMjgwIDIyMCwyODAiIGZpbGw9InVybCgjYWNjZW50MSkiLz4KICAgIDxwb2x5Z29uIHBvaW50cz0iMjIwLDMwMCA5ODAsMzAwIDkwMCwzODUgMzAwLDM4NSIgZmlsbD0idXJsKCNhY2NlbnQyKSIvPgogICAgPHBvbHlnb24gcG9pbnRzPSIzMDAsNDA1IDkwMCw0MDUgODIwLDQ4NSAzODAsNDg1IiBmaWxsPSIjNENDOUYwIi8+CiAgICA8cG9seWdvbiBwb2ludHM9IjM4MCw1MDUgODIwLDUwNSA3NjAsNTcwIDQ0MCw1NzAiIGZpbGw9IiM4MEVEOTkiLz4KICA8L2c+CgogIDx0ZXh0IHg9IjE1MCIgeT0iMjQ1IiBmaWxsPSIjMDgxMjFGIiBmb250LXNpemU9IjM0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPjEuIEV4cG9zdXJlIChTRU8gdGl0bGUgKyBhdHRyaWJ1dGVzKTwvdGV4dD4KICA8dGV4dCB4PSIyNTAiIHk9IjM1MiIgZmlsbD0iIzBEMkUyRSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj4yLiBDbGljayAoY292ZXIgaW1hZ2UgKyBwcmljZSBob29rKTwvdGV4dD4KICA8dGV4dCB4PSIzMzYiIHk9IjQ1NSIgZmlsbD0iIzA3MjYzQiIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj4zLiBDb252ZXJzaW9uIChkZXRhaWwgcGFnZSArIHRydXN0KTwvdGV4dD4KICA8dGV4dCB4PSI0NjgiIHk9IjU0OCIgZmlsbD0iIzA4MzcxNyIgZm9udC1zaXplPSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj40LiBSZXBlYXQgKGJ1bmRsZSArIENTIHF1YWxpdHkpPC90ZXh0PgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3Myw2MDMpIj4KICAgIDxyZWN0IHdpZHRoPSIxMDU0IiBoZWlnaHQ9IjQwIiByeD0iMTIiIGZpbGw9IiMxNjIxM0UiIHN0cm9rZT0iIzVCQzBCRSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8dGV4dCB4PSIyNCIgeT0iMjciIGZpbGw9IiNFQUY0RjQiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+UnVsZTogaW1wcm92ZSBvbmUgYm90dGxlbmVjayBLUEkgZWFjaCB3ZWVrIChDVFIgLT4gQ1ZSIC0+IEFPViAtPiBSZXBlYXQpPC90ZXh0PgogIDwvZz4KPC9zdmc+Cg==)

### 이미지 2: 묶음 가격 전략
![도매매 쿠팡 묶음 가격 전략](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IlByaWNpbmcgYW5kIGJ1bmRsZSBzdHJhdGVneSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnMiIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTAyQTQzIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzI0M0I1MyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iY2FyZEEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZERTY4QSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGNTlFMEIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImNhcmRCIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNDN0QyRkUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNjM2NkYxIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJjYXJkQyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjQTdGM0QwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CgogIDxyZWN0IHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgZmlsbD0idXJsKCNiZzIpIi8+CiAgPHRleHQgeD0iNzIiIHk9Ijg2IiBmaWxsPSIjRjBGNEY4IiBmb250LXNpemU9IjQyIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPkJ1bmRsZSBQcmljaW5nIHRvIFByb3RlY3QgTWFyZ2luPC90ZXh0PgogIDx0ZXh0IHg9IjcyIiB5PSIxMjQiIGZpbGw9IiNEOUUyRUMiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+RG8gbm90IGZpZ2h0IG9ubHkgb24gdW5pdCBwcmljZS4gQ2hhbmdlIHRoZSBjb21wYXJpc29uIGZyYW1lLjwvdGV4dD4KCiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTUsMTkwKSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjM1NSIgcng9IjIwIiBmaWxsPSJ1cmwoI2NhcmRBKSIvPgogICAgPHRleHQgeD0iMjgiIHk9IjU4IiBmaWxsPSIjM0QyMjAwIiBmb250LXNpemU9IjMwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPlNpbmdsZSBQYWNrPC90ZXh0PgogICAgPHRleHQgeD0iMjgiIHk9IjEwNiIgZmlsbD0iIzNEMjIwMCIgZm9udC1zaXplPSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIj45LDkwMCBLUlc8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTU0IiBmaWxsPSIjNEEyRTAwIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPlJvbGU6IHRyYWZmaWMgZW50cnk8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTk4IiBmaWxsPSIjNEEyRTAwIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1hcmdpbjogbG93PC90ZXh0PgogICAgPHRleHQgeD0iMjgiIHk9IjI0MiIgZmlsbD0iIzRBMkUwMCIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5Db252ZXJzaW9uIGFuY2hvcjwvdGV4dD4KICA8L2c+CgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ1MCwxNzApIj4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIzMDAiIGhlaWdodD0iMzk1IiByeD0iMjAiIGZpbGw9InVybCgjY2FyZEIpIi8+CiAgICA8dGV4dCB4PSIyOCIgeT0iNTgiIGZpbGw9IiMxMTE4MjciIGZvbnQtc2l6ZT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCI+My1QYWNrIEJ1bmRsZTwvdGV4dD4KICAgIDx0ZXh0IHg9IjI4IiB5PSIxMDYiIGZpbGw9IiMxMTE4MjciIGZvbnQtc2l6ZT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCI+MjQsOTAwIEtSVzwvdGV4dD4KICAgIDx0ZXh0IHg9IjI4IiB5PSIxNTQiIGZpbGw9IiMxMTE4MjciIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+Um9sZTogcHJvZml0IGNvcmU8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTk4IiBmaWxsPSIjMTExODI3IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1hcmdpbjogbWVkaXVtLWhpZ2g8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMjQyIiBmaWxsPSIjMTExODI3IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkJlc3Qgc2VsbGVyIHRhcmdldDwvdGV4dD4KICAgIDx0ZXh0IHg9IjI4IiB5PSIyODYiIGZpbGw9IiMxMTE4MjciIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+QU9WIGJvb3N0PC90ZXh0PgogIDwvZz4KCiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoODA1LDE0NSkiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0NDUiIHJ4PSIyMCIgZmlsbD0idXJsKCNjYXJkQykiLz4KICAgIDx0ZXh0IHg9IjI4IiB5PSI1OCIgZmlsbD0iIzA1MkUyNCIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj41LVBhY2sgVmFsdWU8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTA2IiBmaWxsPSIjMDUyRTI0IiBmb250LXNpemU9IjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI4MDAiPjM3LDkwMCBLUlc8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTU0IiBmaWxsPSIjMDUyRTI0IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPlJvbGU6IG1heCBtYXJnaW48L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMTk4IiBmaWxsPSIjMDUyRTI0IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1hcmdpbjogaGlnaGVzdDwvdGV4dD4KICAgIDx0ZXh0IHg9IjI4IiB5PSIyNDIiIGZpbGw9IiMwNTJFMjQiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+UmVwZWF0IG9yZGVyIHByZXA8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMjg2IiBmaWxsPSIjMDUyRTI0IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPlNoaXBwaW5nIGVmZmljaWVuY3k8L3RleHQ+CiAgICA8dGV4dCB4PSIyOCIgeT0iMzMwIiBmaWxsPSIjMDUyRTI0IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkRpc2NvdW50IHBlcmNlcHRpb248L3RleHQ+CiAgPC9nPgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3Miw2MTEpIj4KICAgIDxyZWN0IHdpZHRoPSIxMDU2IiBoZWlnaHQ9IjM4IiByeD0iMTAiIGZpbGw9IiMzMzRFNjgiIHN0cm9rZT0iIzlGQjNDOCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICAgIDx0ZXh0IHg9IjIyIiB5PSIyNSIgZmlsbD0iI0YwRjRGOCIgZm9udC1zaXplPSIyMSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5Db250cm9sIG9iamVjdGl2ZTogc2luZ2xlIG9wdGlvbiBrZWVwcyBjbGljayB2b2x1bWUsIGJ1bmRsZSBvcHRpb25zIGNyZWF0ZSBuZXQgcHJvZml0LjwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=)

### 이미지 3: 주간 KPI 대시보드
![도매매 쿠팡 KPI 대시보드](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjY3NSIgdmlld0JveD0iMCAwIDEyMDAgNjc1IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IldlZWtseSBLUEkgZGFzaGJvYXJkIGZvciBDb3VwYW5nIG9wZXJhdGlvbiI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnMyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMEYxNzJBIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFFMjkzQiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ia3BpIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzOEJERjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMjJEM0VFIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjc1IiBmaWxsPSJ1cmwoI2JnMykiLz4KICA8dGV4dCB4PSI3MiIgeT0iODYiIGZpbGw9IiNFMkU4RjAiIGZvbnQtc2l6ZT0iNDIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCI+V2Vla2x5IEtQSSBPcGVyYXRpbmcgRGFzaGJvYXJkPC90ZXh0PgogIDx0ZXh0IHg9IjcyIiB5PSIxMjQiIGZpbGw9IiNDQkQ1RTEiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+TWVhc3VyZSByb290LWNhdXNlIG1ldHJpY3MsIG5vdCBvbmx5IGdyb3NzIHNhbGVzPC90ZXh0PgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3MiwxNjUpIj4KICAgIDxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMTQwIiByeD0iMTYiIGZpbGw9IiMxMTE4MjciIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8dGV4dCB4PSIyMiIgeT0iNDUiIGZpbGw9IiM5NEEzQjgiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+Q1RSPC90ZXh0PgogICAgPHRleHQgeD0iMjIiIHk9IjEwMCIgZmlsbD0iI0UyRThGMCIgZm9udC1zaXplPSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIj4zLjAlPC90ZXh0PgogICAgPHJlY3QgeD0iMTkwIiB5PSIyNCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNrcGkpIi8+CiAgPC9nPgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzNDUsMTY1KSI+CiAgICA8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjE0MCIgcng9IjE2IiBmaWxsPSIjMTExODI3IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHRleHQgeD0iMjIiIHk9IjQ1IiBmaWxsPSIjOTRBM0I4IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkNWUjwvdGV4dD4KICAgIDx0ZXh0IHg9IjIyIiB5PSIxMDAiIGZpbGw9IiNFMkU4RjAiIGZvbnQtc2l6ZT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCI+Mi4yJTwvdGV4dD4KICAgIDxyZWN0IHg9IjE5MCIgeT0iMjQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjgiIGZpbGw9IiNBN0YzRDAiLz4KICA8L2c+CgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYxOCwxNjUpIj4KICAgIDxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMTQwIiByeD0iMTYiIGZpbGw9IiMxMTE4MjciIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8dGV4dCB4PSIyMiIgeT0iNDUiIGZpbGw9IiM5NEEzQjgiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+QU9WPC90ZXh0PgogICAgPHRleHQgeD0iMjIiIHk9IjEwMCIgZmlsbD0iI0UyRThGMCIgZm9udC1zaXplPSI0NiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIj4xOSwwMDA8L3RleHQ+CiAgICA8cmVjdCB4PSIxOTAiIHk9IjI0IiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRkRFNjhBIi8+CiAgPC9nPgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg4OTEsMTY1KSI+CiAgICA8cmVjdCB3aWR0aD0iMjM3IiBoZWlnaHQ9IjE0MCIgcng9IjE2IiBmaWxsPSIjMTExODI3IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHRleHQgeD0iMjIiIHk9IjQ1IiBmaWxsPSIjOTRBM0I4IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPlJldHVybiBSYXRlPC90ZXh0PgogICAgPHRleHQgeD0iMjIiIHk9IjEwMCIgZmlsbD0iI0UyRThGMCIgZm9udC1zaXplPSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIj4zLjglPC90ZXh0PgogICAgPHJlY3QgeD0iMTc3IiB5PSIyNCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0ZDQTVBNSIvPgogIDwvZz4KCiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNzIsMzM4KSI+CiAgICA8cmVjdCB3aWR0aD0iNzgwIiBoZWlnaHQ9IjIzNSIgcng9IjE2IiBmaWxsPSIjMEIxMjIwIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHRleHQgeD0iMjQiIHk9IjQyIiBmaWxsPSIjQ0JENUUxIiBmb250LXNpemU9IjI2IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiPjgtd2VlayBncm93dGggdHJlbmQ8L3RleHQ+CgogICAgPHBvbHlsaW5lIHBvaW50cz0iMzAsMTkwIDE0MCwxNzQgMjUwLDE2OCAzNjAsMTUwIDQ3MCwxMjggNTgwLDExMiA2OTAsOTYgNzUwLDgyIgogICAgICBmaWxsPSJub25lIiBzdHJva2U9IiMzOEJERjgiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgICA8cG9seWxpbmUgcG9pbnRzPSIzMCwyMDUgMTQwLDE5OCAyNTAsMTg2IDM2MCwxODEgNDcwLDE3MCA1ODAsMTYwIDY5MCwxNTIgNzUwLDE0MiIKICAgICAgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjJDNTVFIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9IjMwIiB5MT0iMjEwIiB4Mj0iNzUwIiB5Mj0iMjEwIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPGxpbmUgeDE9IjMwIiB5MT0iMjEwIiB4Mj0iMzAiIHkyPSI2MCIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjIiLz4KICAgIDx0ZXh0IHg9IjY4MCIgeT0iNzgiIGZpbGw9IiM3REQzRkMiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+U2FsZXM8L3RleHQ+CiAgICA8dGV4dCB4PSI2ODAiIHk9IjEzNiIgZmlsbD0iIzg2RUZBQyIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5OZXQgUHJvZml0PC90ZXh0PgogIDwvZz4KCiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoODc1LDMzOCkiPgogICAgPHJlY3Qgd2lkdGg9IjI1MyIgaGVpZ2h0PSIyMzUiIHJ4PSIxNiIgZmlsbD0iIzBCMTIyMCIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjIiLz4KICAgIDx0ZXh0IHg9IjIyIiB5PSI0MCIgZmlsbD0iI0NCRDVFMSIgZm9udC1zaXplPSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIj5XZWVrIEFjdGlvbnM8L3RleHQ+CiAgICA8dGV4dCB4PSIyMiIgeT0iNzgiIGZpbGw9IiNFMkU4RjAiIGZvbnQtc2l6ZT0iMjEiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+MS4gU3RvcCBiYWQgYWRzPC90ZXh0PgogICAgPHRleHQgeD0iMjIiIHk9IjExMiIgZmlsbD0iI0UyRThGMCIgZm9udC1zaXplPSIyMSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj4yLiBJbXByb3ZlIHRvcCBTS1UgcGFnZTwvdGV4dD4KICAgIDx0ZXh0IHg9IjIyIiB5PSIxNDYiIGZpbGw9IiNFMkU4RjAiIGZvbnQtc2l6ZT0iMjEiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+My4gQWRkIGJ1bmRsZSBvcHRpb248L3RleHQ+CiAgICA8dGV4dCB4PSIyMiIgeT0iMTgwIiBmaWxsPSIjRTJFOEYwIiBmb250LXNpemU9IjIxIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPjQuIENoZWNrIHJldHVybiBjYXVzZXM8L3RleHQ+CiAgPC9nPgoKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3Miw2MTEpIj4KICAgIDxyZWN0IHdpZHRoPSIxMDU2IiBoZWlnaHQ9IjM4IiByeD0iMTAiIGZpbGw9IiMxRTI5M0IiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KICAgIDx0ZXh0IHg9IjI0IiB5PSIyNSIgZmlsbD0iI0UyRThGMCIgZm9udC1zaXplPSIyMSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5SdWxlOiBrZWVwIEtQSSByZXZpZXcgd2Vla2x5IGFuZCBtb3ZlIGJ1ZGdldCBvbmx5IHRvIHByb3ZlbiBoaWdoLW1hcmdpbiBTS1VzLjwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=)

## 실전 실행 로드맵: 주문 0건에서 안정 매출까지

### 즉시 실행 (이번주)

- 1,700개 중 여성 옷 카테고리 전수 분석
- 주문 이력 있는 상품 목록 정리 -> 우선 최적화 대상 선정
- 상위 10개 상품 상품명 쿠팡 SEO 공식으로 재작성
- 메인 이미지 3~5개 수동 교체 (배경 제거 + 클린 썸네일)

### 1주차

- 쿠팡 Wing OPEN API Key 발급 신청
- Wing 대시보드에서 전체 상품 노출/클릭 데이터 수집
- 노출수 기준 상위 50개 상품 리스트 확정
- SEO 점수 분석 (상품명 길이, 속성 채움률, 이미지 수)

### 2주차

- 상위 50개 상품 상품명/태그 일괄 수정
- 메인 이미지 50개 배경 제거 + 썸네일 생성 (자동화 도구 활용)
- 쿠팡 CPC 광고 소액 테스트 (일 5,000원) - 클릭률 확인용
- 묶음 옵션 10개 상품에 추가

### 3~4주차

- 자동화 도구(coupang-product-optimizer)로 나머지 상품 순차 최적화
- 광고 데이터 기반 상위 20% SKU에 예산 집중
- 전환율 0% 유지되는 저성과 SKU 비활성화/삭제
- 월간 보고서: 매출, 순이익, 최적화 전후 비교