import fs from "node:fs/promises";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const outDir = "/Users/monoverse/Documents/dragon/Flight/outputs/game_balance";
await fs.mkdir(outDir, { recursive: true });

const wb = Workbook.create();
const guide = wb.worksheets.add("사용 안내");
const player = wb.worksheets.add("플레이어");
const enemies = wb.worksheets.add("적");
const attacks = wb.worksheets.add("적 공격");
const upgrades = wb.worksheets.add("업그레이드");
const progression = wb.worksheets.add("진행 곡선");

const navy = "#17324D", cyan = "#18A6B8", pale = "#E8F6F8", yellow = "#FFF2CC";
const blue = "#DDEBF7", green = "#E2F0D9", gray = "#E7EBEF", red = "#FCE4D6", white = "#FFFFFF";

function title(sheet, range, text) {
  range.merge(); range.values = [[text]];
  range.format = { fill: navy, font: { bold: true, color: white, size: 16 }, verticalAlignment: "center" };
  range.format.rowHeight = 34;
}
function header(range) {
  range.format = { fill: cyan, font: { bold: true, color: white }, verticalAlignment: "center", wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#7A9AA6" } };
  range.format.rowHeight = 30;
}
function finish(sheet, used, widths) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(3);
  used.format.font = { name: "Aptos", size: 10 };
  widths.forEach(([col, width]) => sheet.getRange(`${col}:${col}`).format.columnWidth = width);
}
function input(range, numberFormat) {
  range.format.fill = yellow;
  if (numberFormat) range.format.numberFormat = numberFormat;
}
function calc(range, numberFormat) {
  range.format.fill = blue;
  if (numberFormat) range.format.numberFormat = numberFormat;
}

title(guide, guide.getRange("A1:F1"), "SKY ROGUE · 게임 밸런스 관리표");
guide.getRange("A3:F3").values = [["구분", "용도", "편집 여부", "표시 색상", "코드 위치", "비고"]]; header(guide.getRange("A3:F3"));
guide.getRange("A4:F9").values = [
  ["플레이어", "기본 능력치와 화력 확인", "노란 셀 편집", "노랑=입력 / 파랑=계산", "game.js reset()", "DPS는 공격력×동시 발사÷발사 간격"],
  ["적", "일반·중형 적의 체력/속도/충돌 피해", "노란 셀 편집", "노랑=입력", "game.js spawnEnemy()", "시간에 따른 체력·속도 배율은 진행 곡선 참조"],
  ["적 공격", "탄환·레이저 패턴 관리", "노란 셀 편집", "노랑=입력", "game.js enemyAttack()", "초 단위 값과 px/s 단위 값을 구분"],
  ["업그레이드", "강화 효과와 누적 결과 비교", "노란 셀 편집", "파랑=계산", "game.js upgrades", "반복 횟수를 바꿔 누적 결과 확인"],
  ["진행 곡선", "시간별 웨이브·난이도·스폰 간격", "노란 셀 편집", "파랑=계산", "game.js update()", "0~300초 구간 제공"],
  ["공통", "엑셀 값 변경은 게임 코드에 자동 반영되지 않음", "관리 후 코드 반영 필요", "회색=설명", "game.js", "단위와 수식 열을 함께 확인"]
];
guide.getRange("A4:F9").format.wrapText = true; guide.getRange("A4:F9").format.borders = { preset: "inside", style: "thin", color: "#D6DEE3" };
guide.getRange("A11:F13").merge(true); guide.getRange("A11:F13").values = [["관리 원칙: 한 번에 하나의 입력값만 바꾸고 플레이 테스트 결과를 기록하세요."],["현재 값은 2026-07-05 기준 game.js에서 추출했습니다."],["단위: 속도=px/s, 시간=초, 피해/체력/경험치=게임 내부 수치"]];
guide.getRange("A11:F13").format = { fill: pale, wrapText: true, font: { color: navy } };
finish(guide, guide.getRange("A1:F13"), [["A",16],["B",31],["C",20],["D",23],["E",25],["F",39]]);

title(player, player.getRange("A1:G1"), "플레이어 기본 데이터");
player.getRange("A3:G3").values = [["항목 ID", "항목", "현재 값", "단위", "최솟값", "최댓값", "설명"]]; header(player.getRange("A3:G3"));
player.getRange("A4:G16").values = [
  ["PLAYER_SPEED","기본 이동 속도",285,"px/s",1,1000,"키보드·드래그 이동 속도"],
  ["PLAYER_MAX_HP","기본 최대 체력",100,"HP",1,10000,"게임 시작 체력과 동일"],
  ["PLAYER_DAMAGE","기본 공격력",18,"피해",0,10000,"주 탄환 1발 피해"],
  ["PLAYER_FIRE_INTERVAL","기본 발사 간격",0.31,"초",0.01,10,"낮을수록 빠름"],
  ["PLAYER_MULTISHOT","기본 동시 발사",1,"발",1,5,"한 번 발사 시 탄환 수"],
  ["PLAYER_BULLET_SPEED","주 탄환 속도",720,"px/s",1,3000,"수직 속도 기준"],
  ["PLAYER_HIT_RADIUS","충돌 반경",18,"px",1,100,"플레이어 충돌 판정"],
  ["PLAYER_START_XP_NEED","첫 레벨업 필요 XP",35,"XP",1,10000,"다음 레벨 요구량의 시작값"],
  ["PLAYER_XP_GROWTH","XP 요구량 증가율",1.35,"배",1,3,"레벨업마다 반올림 적용"],
  ["DIVE_DURATION","하강 지속 시간",3,"초",0,30,"하강 중 공격·피격 비활성"],
  ["DIVE_COOLDOWN","하강 재사용 대기",2,"초",0,30,"하강 종료 후 시작"],
  ["WING_FIRE_INTERVAL","윙맨 발사 간격",0.58,"초",0.01,10,"윙맨 공통"],
  ["WING_DAMAGE_RATIO","윙맨 공격력 비율",0.48,"배",0,5,"플레이어 공격력 대비"]
];
input(player.getRange("C4:C16")); player.getRange("C7:C7").format.numberFormat="0.00"; player.getRange("C12:C12").format.numberFormat="0.00"; player.getRange("C16:C16").format.numberFormat="0.00";
player.getRange("A18:D18").values = [["계산 지표", "계산 결과", "단위", "계산식"]]; header(player.getRange("A18:D18"));
player.getRange("A19:A22").values = [["기본 초당 공격 횟수"],["기본 이론 DPS"],["윙맨 1기 DPS"],["윙맨 2기 포함 총 DPS"]];
player.getRange("B19:B22").formulas = [["=1/C7"],["=C6*C8/C7"],["=C6*C16/C15"],["=B20+B21*2"]];
player.getRange("C19:D22").values = [["회/초","1 ÷ 발사 간격"],["피해/초","공격력 × 동시 발사 ÷ 발사 간격"],["피해/초","공격력 × 비율 ÷ 윙맨 발사 간격"],["피해/초","기본 DPS + 윙맨 2기 DPS"]];
calc(player.getRange("B19:B22"), "0.00"); player.getRange("A18:D22").format.borders = { preset:"inside", style:"thin", color:"#D6DEE3" };
finish(player, player.getRange("A1:G22"), [["A",25],["B",23],["C",13],["D",12],["E",12],["F",12],["G",36]]);

title(enemies, enemies.getRange("A1:K1"), "적 기본 데이터");
enemies.getRange("A3:K3").values = [["적 ID","유형","기본 체력","최소 속도","최대 속도","속도 배율","충돌 피해","충돌 반경","처치 점수","획득 XP","등장 확률 기준"]]; header(enemies.getRange("A3:K3"));
enemies.getRange("A4:K5").values = [
  ["ENEMY_NORMAL","일반",30,62,96,1,14,18,10,5,"1 - 중형 확률"],
  ["ENEMY_HEAVY","중형",95,62,96,0.72,26,30,35,12,"시간별 10%→최대 28%"]
];
input(enemies.getRange("C4:J5")); enemies.getRange("F4:F5").format.numberFormat="0.00";
enemies.getRange("A7:F7").values = [["확률/배율 ID","항목","시작값","시간 계수","상한","설명"]]; header(enemies.getRange("A7:F7"));
enemies.getRange("A8:F10").values = [
  ["HEAVY_CHANCE","중형 적 등장 확률",0.10,300,0.28,"MIN(시작값 + 생존시간÷시간계수, 상한)"],
  ["HP_TOUGHNESS","적 체력 난이도 배율",1,55,"없음","1 + 생존시간÷시간계수"],
  ["SPEED_GROWTH","적 속도 시간 배율",1,240,"없음","1 + 생존시간÷시간계수"]
];
input(enemies.getRange("C8:E10")); enemies.getRange("C8:C8").format.numberFormat="0.0%"; enemies.getRange("E8:E8").format.numberFormat="0.0%";
enemies.getRange("A12:D12").values = [["공격 패턴","일반 적 확률","중형 적 확률","선택 로직"]]; header(enemies.getRange("A12:D12"));
enemies.getRange("A13:D15").values = [["조준 구체",0.72,0,"일반 roll < 0.72"],["원형 탄막",0.18,0.50,"일반 0.72~0.90 / 중형 roll ≥ 0.50"],["레이저",0.10,0.50,"일반 roll ≥ 0.90 / 중형 roll < 0.50"]];
input(enemies.getRange("B13:C15"), "0.0%");
finish(enemies, enemies.getRange("A1:K15"), [["A",24],["B",13],["C",12],["D",12],["E",12],["F",12],["G",12],["H",12],["I",12],["J",12],["K",27]]);

title(attacks, attacks.getRange("A1:K1"), "적 공격 패턴 데이터");
attacks.getRange("A3:K3").values = [["공격 ID","패턴","피해","탄속","반경","수명","경고 시간","활성 시간","일반 발사 수","중형 발사 수","설명"]]; header(attacks.getRange("A3:K3"));
attacks.getRange("A4:K6").values = [
  ["ORB","조준 구체",13,205,8,6,"-","-",1,1,"탄속은 웨이브당 +4"],
  ["BURST","원형 탄막",10,135,6,5,"-","-",8,12,"중형 탄속은 155"],
  ["LASER","직선 레이저",24,"-",9,"-",0.85,0.42,1,1,"반경은 판정 여유값"]
];
input(attacks.getRange("C4:J6")); attacks.getRange("G6:H6").format.numberFormat="0.00";
attacks.getRange("A8:F8").values = [["공격 주기 ID","대상","첫 공격 최소","첫 공격 최대","반복 최소","반복 최대"]]; header(attacks.getRange("A8:F8"));
attacks.getRange("A9:F10").values = [["ATTACK_NORMAL","일반 적",1.1,2.4,2.8,4.4],["ATTACK_HEAVY","중형 적",1.1,2.4,2.2,3.4]];
input(attacks.getRange("C9:F10"), "0.0");
finish(attacks, attacks.getRange("A1:K10"), [["A",23],["B",16],["C",11],["D",11],["E",10],["F",10],["G",13],["H",13],["I",14],["J",14],["K",27]]);

title(upgrades, upgrades.getRange("A1:J1"), "레벨업 업그레이드 데이터");
upgrades.getRange("A3:J3").values = [["업그레이드 ID","이름","대상 능력치","효과 유형","효과 값","최대/최소","반복 횟수","기본값","누적 결과","설명"]]; header(upgrades.getRange("A3:J3"));
upgrades.getRange("A4:H10").values = [
  ["UP_FIRE_RATE","화염 연사","발사 간격","곱연산",0.82,0.085,1,0.31],
  ["UP_DAMAGE","용의 심장","공격력","곱연산",1.35,"-",1,18],
  ["UP_MULTISHOT","갈라지는 불꽃","동시 발사","가산",1,5,1,1],
  ["UP_SPEED","바람의 날개","이동 속도","곱연산",1.16,"-",1,285],
  ["UP_MAX_HP","고대의 비늘","최대 체력","가산",25,"-",1,100],
  ["UP_HEAL","재생의 숨결","현재 체력","회복",45,"최대 체력",1,100],
  ["UP_WINGMAN","새끼 드래곤","윙맨 수","가산",1,2,1,0]
];
input(upgrades.getRange("E4:H10"));
upgrades.getRange("I4:I10").formulas = [["=MAX(F4,H4*E4^G4)"],["=H5*E5^G5"],["=MIN(F6,H6+E6*G6)"],["=H7*E7^G7"],["=H8+E8*G8"],["=MIN(H9+E9*G9,H9)"],["=MIN(F10,H10+E10*G10)"]];
upgrades.getRange("J4:J10").values = [["발사 간격 18% 감소, 하한 적용"],["공격력 +35%"],["동시 발사 +1, 최대 5"],["이동 속도 +16%"],["최대 체력 +25 및 동일량 회복"],["체력 45 회복, 최대 체력 제한"],["LV.1 좌측 / LV.2 우측"]];
calc(upgrades.getRange("I4:I10"), "0.00"); upgrades.getRange("G4:G10").dataValidation = { rule: { type:"whole", operator:"between", formula1:0, formula2:20 } };
upgrades.getRange("A12:E12").values = [["반복 횟수","공격력","발사 간격","동시 발사","이론 DPS"]]; header(upgrades.getRange("A12:E12"));
upgrades.getRange("A13:A18").values = [[0],[1],[2],[3],[4],[5]];
upgrades.getRange("B13:B18").formulas = [["='플레이어'!C6*E5^A13"],["='플레이어'!C6*E5^A14"],["='플레이어'!C6*E5^A15"],["='플레이어'!C6*E5^A16"],["='플레이어'!C6*E5^A17"],["='플레이어'!C6*E5^A18"]];
upgrades.getRange("C13:C18").formulas = [["=MAX(F4,'플레이어'!C7*E4^A13)"],["=MAX(F4,'플레이어'!C7*E4^A14)"],["=MAX(F4,'플레이어'!C7*E4^A15)"],["=MAX(F4,'플레이어'!C7*E4^A16)"],["=MAX(F4,'플레이어'!C7*E4^A17)"],["=MAX(F4,'플레이어'!C7*E4^A18)"]];
upgrades.getRange("D13:D18").formulas = [["=MIN(F6,'플레이어'!C8+E6*A13)"],["=MIN(F6,'플레이어'!C8+E6*A14)"],["=MIN(F6,'플레이어'!C8+E6*A15)"],["=MIN(F6,'플레이어'!C8+E6*A16)"],["=MIN(F6,'플레이어'!C8+E6*A17)"],["=MIN(F6,'플레이어'!C8+E6*A18)"]];
upgrades.getRange("E13:E18").formulas = [["=B13*D13/C13"],["=B14*D14/C14"],["=B15*D15/C15"],["=B16*D16/C16"],["=B17*D17/C17"],["=B18*D18/C18"]]; calc(upgrades.getRange("B13:E18"), "0.00");
finish(upgrades, upgrades.getRange("A1:J18"), [["A",23],["B",18],["C",17],["D",14],["E",12],["F",13],["G",12],["H",12],["I",14],["J",36]]);

title(progression, progression.getRange("A1:J1"), "시간별 진행 곡선");
progression.getRange("A3:J3").values = [["생존 시간","웨이브","적 체력 배율","적 속도 배율","중형 확률","스폰 간격","일반 체력","중형 체력","구체 탄속","다음 레벨 필요 XP"]]; header(progression.getRange("A3:J3"));
progression.getRange("A4:A24").values = Array.from({length:21},(_,i)=>[i*15]); input(progression.getRange("A4:A24"), "0");
for (let r=4;r<=24;r++) {
  progression.getRange(`B${r}:J${r}`).formulas = [[
    `=1+INT(A${r}/25)`,
    `=1+A${r}/'적'!D9`,
    `=1+A${r}/'적'!D10`,
    `=MIN('적'!C8+A${r}/'적'!D8,'적'!E8)`,
    `=MAX(0.55,1.22-A${r}/260)`,
    `='적'!C4*C${r}`,
    `='적'!C5*C${r}`,
    `='적 공격'!D4+B${r}*4`,
    `=ROUND('플레이어'!C11*'플레이어'!C12^(B${r}-1),0)`
  ]];
}
calc(progression.getRange("B4:J24")); progression.getRange("C4:E24").format.numberFormat="0.00"; progression.getRange("E4:E24").format.numberFormat="0.0%"; progression.getRange("F4:F24").format.numberFormat="0.00"; progression.getRange("G4:J24").format.numberFormat="0";
finish(progression, progression.getRange("A1:J24"), [["A",13],["B",11],["C",14],["D",14],["E",13],["F",12],["G",12],["H",12],["I",12],["J",18]]);

for (const s of [guide,player,enemies,attacks,upgrades,progression]) {
  const used = s.getUsedRange();
  used.format.verticalAlignment = "center";
}

const previews = [];
for (const name of ["사용 안내","플레이어","적","적 공격","업그레이드","진행 곡선"]) {
  const blob = await wb.render({ sheetName:name, autoCrop:"all", scale:1, format:"png" });
  const path = `${outDir}/preview_${name.replaceAll(" ","_")}.png`;
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
  previews.push(path);
}

console.log((await wb.inspect({kind:"table",range:"플레이어!A18:D22",include:"values,formulas",tableMaxRows:10,tableMaxCols:8})).ndjson);
console.log((await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",options:{useRegex:true,maxResults:100},summary:"formula errors"})).ndjson);

const file = await SpreadsheetFile.exportXlsx(wb);
await file.save(`${outDir}/sky_rogue_game_balance.xlsx`);
console.log(JSON.stringify({output:`${outDir}/sky_rogue_game_balance.xlsx`,previews}));
