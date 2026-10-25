/* =====================================================================
   data.js — Welfare State Simulator: məzmun, cavab açarı, qiymətləndirmə qaydaları
   ---------------------------------------------------------------------
   Bütün tədris məzmunu «Mövzu 5. Sosial siyasətin modelləri» dərs
   materialına əsaslanır (1-ci sual: «Sosial siyasətin modellərinin izahı»).

   Hər cavabın «basis» sahəsi var:
     "direct" — məlumat dərs materialında birbaşa yazılıb;
     "interp" — material bu göstəricini həmin model üçün ayrıca təsvir etmir,
                cavab modelin materialda verilən ümumi prinsiplərindən çıxarılıb
                (interpretasiya). Belə kartlar rəy mərhələsində və hesabatda
                ayrıca qeyd olunur.

   CONFIG.ONLY_DIRECT_SOURCE = true edilərsə, yalnız birbaşa əsaslandırılan
   kartlar oyunda qalır və 60 bal qalan kartlar arasında bərabər bölünür.
   ===================================================================== */
"use strict";

/* ---------- 1. Ümumi parametrlər ---------- */
const CONFIG = {
  TOTAL_MIN: 25,          // ümumi vaxt (dəqiqə)
  S1_MIN: 12,             // birinci mərhələ
  S2_MIN: 10,             // ikinci mərhələ
  FINAL_MIN: 3,           // yekunlaşdırma
  STAGE1_MAX: 60,         // birinci mərhələnin maksimum balı
  S2_COMPLETE_MAX: 20,    // 12 göstəricinin tamamlanması
  S2_LOGIC_MAX: 10,       // modeldaxili məntiqi uyğunluq
  S2_JUSTIF_MAX: 10,      // əsaslandırma (müəllim qiymətləndirir)
  JUSTIF_MAX_CHARS: 300,
  JUSTIF_MIN_CHARS: 20,
  ONLY_DIRECT_SOURCE: false,
  STORAGE_KEY: "wss_rifah_dovleti_v1"
};

/* ---------- 2. Modellər ---------- */
const MODELS = [
  { id: "sd",  name: "Sosial-demokratik model",         short: "Sosial-demokratik",  code: "SD", color: "#1f7a4d", soft: "#e2f2e9" },
  { id: "lib", name: "Liberal model",                   short: "Liberal",            code: "LB", color: "#1d4e89", soft: "#e3ecf8" },
  { id: "kor", name: "Konservativ-korporatist model",   short: "Korporatist",        code: "KK", color: "#9a6412", soft: "#f8eddb" },
  { id: "ara", name: "Aralıq dənizi modeli",            short: "Aralıq dənizi",      code: "AD", color: "#b4472b", soft: "#f9e4dd" }
];

/* ---------- 3. 12 göstərici ---------- */
const INDICATORS = [
  { id: 1,  name: "Dövlətin sosial siyasətdə rolu" },
  { id: 2,  name: "Pensiya sistemi" },
  { id: 3,  name: "Səhiyyə və tibbi sığorta" },
  { id: 4,  name: "Sosial sığortanın maliyyələşdirilməsi" },
  { id: 5,  name: "Sosial təminatın əhatə dairəsi" },
  { id: 6,  name: "Ailənin sosial müdafiədə rolu" },
  { id: 7,  name: "Fərdin sosial məsuliyyəti" },
  { id: 8,  name: "Vergi siyasəti" },
  { id: 9,  name: "Sosial yardımın təşkili" },
  { id: 10, name: "Əmək bazarı və məşğulluq" },
  { id: 11, name: "Sosial bərabərsizlik" },
  { id: 12, name: "Ölkə nümunələri" }
];

/* ---------- 4. Mənbə qeydləri ---------- */
const SRC = {
  sd:  "Mövzu 5, 1-ci sual, «Sosial-demokratik model»",
  lib: "Mövzu 5, 1-ci sual, «Liberal model»",
  kor: "Mövzu 5, 1-ci sual, «Korporatist model»",
  ara: "Mövzu 5, 1-ci sual, «Aralıq dənizi modeli»"
};

/* ---------- 5. Kart mətnləri və cavab açarı (xam cədvəl) ----------
   Format: [göstərici, model, kartın mətni, basis, izah]
   Eyni göstəricinin kartları qəsdən fərqli model ardıcıllığı ilə yazılıb.
   Kartların ID-ləri ardıcıl verilir və cavabı üzə çıxarmır. */
const _RAW = [
  // 1. Dövlətin rolu
  [1, "lib", "Dövlətin rolu məhduddur: yalnız ehtiyacı olanlara minimum səviyyədə kömək edir.", "direct",
        "Liberal modeldə dövlət sosial təminatda məhdud rol oynayır və yalnız ehtiyacı olanlara minimum səviyyədə kömək edir."],
  [1, "sd",  "Dövlət sosial siyasətdə güclü oyunçu kimi çıxış edir və geniş miqyaslı sosial xidmətləri təmin edir.", "direct",
        "Sosial-demokratik modeldə dövlət güclü rol oynayır və geniş miqyaslı sosial xidmətləri təşkil edir."],
  [1, "ara", "Sosial təminat dövlət tərəfindən təmin edilsə də, dövlətin təşkil etdiyi sosial müdafiə zəifdir.", "direct",
        "Aralıq dənizi modelində sosial təminat dövlət tərəfindən verilir, lakin dövlətin təmin etdiyi müdafiə zəif təşkil olunub."],
  [1, "kor", "Dövlət, işçilər və işəgötürənlər birgə fəaliyyət göstərir; məqsəd sosial qruplar arasında maraq balansını qorumaqdır.", "direct",
        "Korporatist model işçilərin, işəgötürənlərin və dövlətin birgə fəaliyyət göstərdiyi korporativ strukturlara əsaslanır."],

  // 2. Pensiya sistemi
  [2, "kor", "Pensiya hüququ işləyən şəxsin əmək bazarındakı statusundan və sosial sığortaya töhfəsindən asılıdır.", "direct",
        "Korporatist modeldə pensiya, tibbi sığorta və işsizlik müavinəti işləyən şəxsin statusuna və sosial sığorta töhfələrinə əsasən müəyyən edilir."],
  [2, "sd",  "Pensiya bütün əhali qrupları üçün əlçatan olan universal sosial xidmətlərin tərkib hissəsidir.", "direct",
        "Sosial-demokratik modeldə universallıq təhsil, səhiyyə, pensiya və digər xidmətlərin bütün əhali qrupları üçün əlçatan olması deməkdir."],
  [2, "lib", "Pensiya təminatında dövlətin payı məhduddur; əsas məsuliyyət fərdin və özəl sektorun üzərinə düşür.", "interp",
        "Material liberal modelin pensiya sistemini ayrıca təsvir etmir. Cavab ümumi prinsiplərdən çıxarılıb: dövlət proqramları məhduddur, fərdi məsuliyyət və özəl sektorun rolu vurğulanır."],
  [2, "ara", "Pensiya kimi sosial proqramlar müəyyən qruplara yönəlib və universal deyil; dövlət müdafiəsini ailə dəstəyi tamamlayır.", "interp",
        "Material Aralıq dənizi modelinin pensiya sistemini ayrıca təsvir etmir. Cavab ümumi prinsiplərdən çıxarılıb: proqramlar müəyyən qruplara yönəlib, universallıq yoxdur, ailənin rolu böyükdür."],

  // 3. Səhiyyə və tibbi sığorta
  [3, "sd",  "Səhiyyə xidmətləri yüksək keyfiyyətlidir və hər kəs üçün pulsuz və ya çox ucuz şəkildə əlçatandır.", "direct",
        "Sosial-demokratik modeldə təhsil, səhiyyə və sosial xidmətlər yüksək keyfiyyətlidir və hər kəs üçün pulsuz və ya çox ucuzdur."],
  [3, "ara", "Səhiyyə də daxil olmaqla sosial proqramlar müəyyən qruplara yönəlib; universal əhatə yoxdur.", "interp",
        "Material Aralıq dənizi modelində səhiyyəni ayrıca təsvir etmir. Cavab ümumi prinsipdən çıxarılıb: sosial proqramlar müəyyən qruplara yönəlib, universallıq yoxdur."],
  [3, "kor", "Tibbi sığorta xidmətləri işləyən şəxslərin statusuna görə müəyyən edilir.", "direct",
        "Korporatist modeldə işsizlik müavinəti, pensiya və tibbi sığorta işləyən şəxslərin statusuna görə müəyyən edilir."],
  [3, "lib", "Sağlamlıq sığortası əksər hallarda özəl şirkətlər vasitəsilə təmin edilir.", "direct",
        "Liberal modeldə sosial təminat xidmətlərində özəl sektor mühüm rol oynayır; material nümunə kimi ABŞ-da sağlamlıq sığortasının özəl şirkətlər vasitəsilə təmin olunmasını göstərir."],

  // 4. Sosial sığortanın maliyyələşdirilməsi
  [4, "lib", "Dövlət xərcləri məhdud olduğundan sosial təminatın təşkilində özəl sektor mühüm rol oynayır.", "direct",
        "Liberal modeldə dövlət xərcləri və sosial müdafiə proqramları məhduddur, sosial təminat xidmətlərində isə özəl sektor mühüm rol oynayır."],
  [4, "kor", "Sosial hüquqlar işçilərin sosial sığorta sisteminə verdiyi töhfələr əsasında formalaşır.", "direct",
        "Korporatist modeldə işçilər işlə təmin olunmaları və sosial sığorta sisteminə töhfələri əsasında sosial hüquqlar əldə edirlər."],
  [4, "ara", "Sosial müdafiənin yükü dövlət təminatı ilə yanaşı ailə və cəmiyyət arasında bölüşdürülür.", "interp",
        "Material bu modeldə maliyyələşmə mexanizmini ayrıca təsvir etmir. Cavab müdafiənin dövlət, ailə və cəmiyyət arasında bölüşdürülməsi haqqında məlumatdan çıxarılıb."],
  [4, "sd",  "Sosial müdafiə sisteminin maliyyələşdirilməsi yüksək vergilər vasitəsilə həyata keçirilir.", "direct",
        "Sosial-demokratik modeldə geniş miqyaslı sosial xidmətlərin maliyyələşdirilməsi yüksək vergilər vasitəsilə həyata keçirilir."],

  // 5. Sosial təminatın əhatə dairəsi
  [5, "ara", "Sosial proqramlar müəyyən qruplara yönəlib və universallıq yoxdur.", "direct",
        "Aralıq dənizi modelində sosial proqramlar müəyyən qruplara yönəlib və universallıq yoxdur."],
  [5, "sd",  "Xidmətlər ehtiyac əsasında deyil, universallıq prinsipi ilə bütün vətəndaşlara yönəldilir.", "direct",
        "Sosial-demokratik modeldə xidmətlər və təminatlar bütün vətəndaşlara yönəldilir, ehtiyac əsasında deyil, universallıq prinsipinə əsaslanır."],
  [5, "lib", "Dövlət proqramlarının əhatəsi məhduddur və universallıq azdır; özəl sektor mühüm rol oynayır.", "direct",
        "Liberal modeldə dövlətin təmin etdiyi proqramlar daha məhduddur, universallıq azdır və özəl sektor mühüm rol oynayır."],
  [5, "kor", "Universal təminat prinsipi yoxdur; müdafiədən əsasən sosial sığorta sisteminin iştirakçısı olan işləyənlər faydalanır.", "direct",
        "Korporatist modeldə universal təminat prinsipi yoxdur, sosial hüquqlar əmək bazarındakı mövqedən və sığorta iştirakından asılıdır."],

  // 6. Ailənin sosial müdafiədə rolu
  [6, "kor", "Ailə əsas sosial institut sayılır; dövlət ailəni qorumağa çalışır və çoxuşaqlı ailələrə xüsusi yardımlar nəzərdə tutur.", "direct",
        "Korporatist modeldə ailə əsas sosial institut kimi qəbul edilir, dövlət onu qorumağa çalışır və çoxuşaqlı ailələr üçün xüsusi yardımlar nəzərdə tutulur."],
  [6, "lib", "Sosial təminat ailədən daha çox fərdin öz məsuliyyəti kimi qəbul edilir.", "interp",
        "Material liberal modeldə ailənin rolunu ayrıca açıqlamır. Cavab modelin əsas prinsipindən çıxarılıb: insanlar sosial təminat üçün əsas məsuliyyəti öz üzərlərinə götürməlidirlər."],
  [6, "sd",  "Uşaq baxımı kimi sosial xidmətlərin təşkili dövlətin üzərinə düşür.", "direct",
        "Sosial-demokratik modeldə dövlətdən uşaq baxımı daxil olmaqla əsas sosial xidmətləri təşkil etməsi gözlənilir."],
  [6, "ara", "Sosial müdafiə ailə və qeyri-rəsmi şəbəkələr vasitəsilə həyata keçirilir; ailə birliyi güclüdür.", "direct",
        "Aralıq dənizi modelində sosial müdafiə ailə və qeyri-rəsmi şəbəkələr vasitəsilə həyata keçirilir, ailə birliyi və sosial şəbəkələr güclüdür."],

  // 7. Fərdin sosial məsuliyyəti
  [7, "sd",  "Bütün vətəndaşlara bərabər sosial hüquqlar və imkanlar təmin edilir; təminat fərdin öz imkanlarından asılı qoyulmur.", "interp",
        "Material bütün vətəndaşlara bərabər sosial hüquqların təmin edilməsini bu modelin əsas məqsədi kimi göstərir. Fərdi məsuliyyətin rolu haqqında nəticə interpretasiyadır."],
  [7, "kor", "Fərd sosial hüquqları işlə təmin olunmaqla və sosial sığorta sisteminə töhfə verməklə qazanır.", "direct",
        "Korporatist modeldə işçilər işlə təmin olunmaları və sosial sığorta sisteminə töhfələri əsasında sosial hüquqlar əldə edirlər."],
  [7, "ara", "Fərdlər dövlət müdafiəsinin zəifliyini ailə birliyi və qeyri-rəsmi şəbəkələr hesabına tamamlayır.", "interp",
        "Material fərdin məsuliyyətini bu modeldə ayrıca təsvir etmir. Cavab dövlət müdafiəsinin zəif təşkil olunması və ailə ilə şəbəkələrin güclü rolu haqqında məlumatdan çıxarılıb."],
  [7, "lib", "Fərd öz həyatını idarə etmək və sosial təminatını təmin etmək üçün əsas məsuliyyəti öz üzərinə götürür.", "direct",
        "Liberal modeldə insanlar öz həyatlarını idarə etmək və sosial təminatlarını təmin etmək üçün əsas məsuliyyəti öz üzərlərinə götürməlidirlər."],

  // 8. Vergi siyasəti
  [8, "lib", "Vergilər nisbətən aşağıdır, çünki dövlət xərcləri və sosial müdafiə proqramları məhduddur.", "direct",
        "Liberal modeldə vergilər nisbətən aşağı olur, çünki dövlət xərcləri və sosial müdafiə proqramları məhduddur."],
  [8, "sd",  "Vergilər yüksəkdir; bu, bərabərsizliyi azaltmağa və hamı üçün keyfiyyətli xidmətlər göstərməyə imkan verir.", "direct",
        "Sosial-demokratik ölkələrdə vergilər yüksəkdir; məqsəd bərabərsizliyi azaltmaq və hər kəs üçün yüksək keyfiyyətli xidmətlər təmin etməkdir."],
  [8, "ara", "Qeyri-rəsmi iqtisadi fəaliyyət geniş yayıldığından vergi və sosial sığorta ilə əhatə olunmayan sahə böyükdür.", "interp",
        "Material bu modeldə vergi siyasətini təsvir etmir. Cavab yüksək səviyyədə qeyri-rəsmi iqtisadi fəaliyyət haqqında məlumatdan çıxarılan interpretasiyadır."],
  [8, "kor", "Sosial hüquqlar ümumi vergilərdən çox işləyənlərin sosial sığorta töhfələri ilə əlaqələndirilir.", "interp",
        "Material korporatist modelin vergi siyasətini ayrıca təsvir etmir. Cavab hüquqların sığorta töhfələrinə əsaslanması məlumatından çıxarılıb."],

  // 9. Sosial yardımın təşkili
  [9, "sd",  "Xidmətlər ehtiyac əsasında deyil, hamıya eyni standartlarla təqdim edilir.", "direct",
        "Sosial-demokratik modeldə sosial xidmətlər eyni standartlara uyğun olaraq hər kəsə təmin edilir."],
  [9, "ara", "Sosial təminat dövlət tərəfindən təmin edilir, lakin ailə və cəmiyyət də müdafiənin təşkilində böyük rol oynayır.", "direct",
        "Aralıq dənizi modelində sosial təminat dövlət tərəfindən təmin edilir, lakin ailə və cəmiyyətin sosial müdafiədə böyük rolu var."],
  [9, "lib", "Sosial yardımlar ehtiyac əsasında, daha çox işsizlərə və yoxsul təbəqələrə verilir.", "direct",
        "Liberal modeldə sosial yardımlar ehtiyac əsasında verilir və daha çox işsizlər və yoxsul təbəqələr üçün nəzərdə tutulur."],
  [9, "kor", "Təminat ixtisaslaşmış və peşə fəaliyyətinə uyğun təşkil olunur; fərqli statuslar üçün fərqli hüquqlar nəzərdə tutulur.", "direct",
        "Korporatist modeldə fərdlər sosial statuslarına uyğun müxtəlif hüquqlar əldə edir, təminat isə peşə fəaliyyətinə uyğun təşkil olunur."],

  // 10. Əmək bazarı və məşğulluq
  [10, "ara", "Yüksək səviyyədə qeyri-rəsmi iqtisadi fəaliyyət mövcuddur.", "direct",
        "Aralıq dənizi modelində yüksək səviyyədə qeyri-rəsmi iqtisadi fəaliyyət mövcuddur."],
  [10, "lib", "İnsanların rifahı əsasən bazar iqtisadiyyatı və bazarın rəqabətçi təbiəti vasitəsilə tənzimlənir.", "direct",
        "Liberal modeldə dövlət müdaxiləsi məhduddur və rifah əsasən bazar iqtisadiyyatı və bazarın rəqabətçi təbiəti vasitəsilə tənzimlənir."],
  [10, "sd",  "Dövlət işsizlərə geniş dəstək proqramları həyata keçirir və işçilərin əmək bazarına yenidən daxil olmasını təmin edir.", "direct",
        "Sosial-demokratik modeldə dövlət işsizlər üçün geniş dəstək proqramları həyata keçirir və işçilərin əmək bazarına yenidən daxil olmasını təmin edir."],
  [10, "kor", "Sosial hüquqlar peşə statusundan asılıdır; ənənəvi ailə dəyərləri qadınların iş bazarına inteqrasiyasını məhdudlaşdıra bilər.", "direct",
        "Korporatist modeldə sosial təminat əmək bazarındakı peşə statusuna bağlıdır və ənənəvi ailə dəyərləri qadınların iş bazarına inteqrasiyasını məhdudlaşdıra bilər."],

  // 11. Sosial bərabərsizlik
  [11, "kor", "Bərabərsizlik nisbətən yüksəkdir və təbəqələşməni artıra bilər, çünki hüquqlar əmək bazarındakı mövqedən asılıdır.", "direct",
        "Korporatist modeldə sosial bərabərsizlik nisbətən yüksəkdir, çünki sosial hüquqlar əmək bazarındakı mövqedən asılıdır və universal təminat yoxdur."],
  [11, "ara", "Bərabərsizlik yüksək səviyyədə ola bilər: dövlət müdafiəsi zəif təşkil olunub, ailə və qeyri-rəsmi şəbəkələrin rolu böyükdür.", "direct",
        "Aralıq dənizi modelində sosial bərabərsizlik yüksək səviyyədə ola bilər; ailə və şəbəkələr güclü olsa da, dövlət müdafiəsi zəif təşkil olunub."],
  [11, "sd",  "Sosial bərabərlik əsas dəyərdir; təbəqələşmə və ayrı-seçkilik minimum səviyyədədir.", "direct",
        "Sosial-demokratik modeldə sosial bərabərlik və ədalət əsas dəyərlərdir, təbəqələşmə və ayrı-seçkilik isə minimum səviyyədədir."],
  [11, "lib", "Dövlətin məhdud iştirakı bərabərsizliyin və sosial problemlərin artmasına səbəb ola bilər.", "direct",
        "Material liberal modelin əsas çatışmazlığı kimi dövlətin məhdud iştirakı nəticəsində bərabərsizliyin və sosial problemlərin artmasını göstərir."],

  // 12. Ölkə nümunələri
  [12, "sd",  "Skandinaviya ölkələri: İsveç, Norveç, Danimarka.", "direct",
        "Material sosial-demokratik modelin tətbiq olunduğu ölkələr kimi İsveç, Norveç və Danimarkanı göstərir."],
  [12, "lib", "Anglo-Sakson ölkələri: ABŞ, Böyük Britaniya, Kanada, Avstraliya.", "direct",
        "Material liberal modelin tətbiq olunduğu ölkələr kimi ABŞ, Böyük Britaniya, Kanada və Avstraliyanı göstərir."],
  [12, "ara", "İtaliya, İspaniya, Portuqaliya, Yunanıstan.", "direct",
        "Material Aralıq dənizi modelinə İtaliya, İspaniya, Portuqaliya və Yunanıstanda rast gəlindiyini göstərir."],
  [12, "kor", "Mərkəzi Avropa ölkələri: Almaniya, Avstriya, Belçika.", "direct",
        "Material korporatist modelin əsasən Almaniya, Avstriya və Belçika kimi Mərkəzi Avropa ölkələrində tətbiq olunduğunu göstərir."]
];

/* ---------- 6. İki ayrı məlumat strukturu ----------
   CARDS       — istifadəçiyə göstərilən hissə (ID, göstərici, mətn).
   ANSWER_KEY  — cavab açarı və əsaslandırma (interfeysdə əvvəlcədən göstərilmir). */
const CARDS = [];
const ANSWER_KEY = {};
_RAW.forEach(function (r, i) {
  const id = "k" + String(i + 1).padStart(2, "0");
  CARDS.push({ id: id, ind: r[0], text: r[2] });
  ANSWER_KEY[id] = { model: r[1], basis: r[3], why: r[4], src: SRC[r[1]] };
});

/* Oyunda iştirak edən kartlar (CONFIG.ONLY_DIRECT_SOURCE-a görə) */
const ACTIVE_CARDS = CARDS.filter(function (c) {
  return !CONFIG.ONLY_DIRECT_SOURCE || ANSWER_KEY[c.id].basis === "direct";
});

/* ---------- 7. İkinci mərhələ: ölkələr ---------- */
const COUNTRIES = [
  "Azərbaycan", "Türkiyə", "İsveç", "Norveç", "Danimarka", "ABŞ", "Kanada", "Böyük Britaniya",
  "Almaniya", "Avstriya", "Belçika", "İtaliya", "İspaniya", "Portuqaliya", "Yunanıstan",
  "Estoniya", "Latviya", "Litva"
];

/* ---------- 8. İkinci mərhələ: göstərici variantları ----------
   Burada «düzgün cavab» yoxdur. «v» yalnız daxili məntiqi uyğunluq
   yoxlaması üçündür (LOGIC_RULES), klassik modellərə uyğunluq yoxlanmır. */
const S2_OPTIONS = {
  1: { hint: "Sosial xidmətləri kim təşkil edir və idarə edir?", options: [
    { id: "a", v: "high",    text: "Dövlət əsas sosial xidmətləri özü təşkil edir və maliyyələşdirir." },
    { id: "b", v: "partner", text: "Dövlət sosial tərəfdaşlarla (işçi və işəgötürən təmsilçiləri) birgə sistemi idarə edir." },
    { id: "c", v: "low",     text: "Dövlət yalnız ən həssas qrupları dəstəkləyir, qalanını bazar və fərdlər həll edir." },
    { id: "d", v: "shared",  text: "Dövlət çərçivəni qurur, icranı ailə, icma və özəl/QHT sektoru ilə bölüşür." }
  ]},
  2: { hint: "Yaşlılıq təminatı necə qurulur?", options: [
    { id: "a", v: "universal", text: "Hamıya bərabər universal əsas pensiya (ümumi vergilərlə maliyyələşir)." },
    { id: "b", v: "contrib",   text: "Əmək stajı və sosial sığorta töhfələrinə bağlı pensiya." },
    { id: "c", v: "multi",     text: "Üç pilləli sistem: dövlət əsas pensiyası + şəxsi yığım pensiyası + könüllü yığım." },
    { id: "d", v: "minimal",   text: "Yalnız ehtiyacı olanlar üçün minimum pensiya; əsas təminat fərdi yığımlardan gəlir." }
  ]},
  3: { hint: "Səhiyyəyə çıxış və tibbi sığorta necə təşkil olunur?", options: [
    { id: "a", v: "universal", text: "Hamı üçün pulsuz və ya çox ucuz dövlət səhiyyəsi." },
    { id: "b", v: "insurance", text: "Məcburi tibbi sığorta (töhfə əsaslı); həssas qruplar üçün ödənişi dövlət edir." },
    { id: "c", v: "private",   text: "Əsasən özəl sığorta və özəl xidmət; dövlət yalnız aztəminatlılara kömək edir." },
    { id: "d", v: "mixed",     text: "Baza paket dövlət tərəfindən, əlavə xidmətlər könüllü özəl sığorta ilə." }
  ]},
  4: { hint: "Sosial sığorta və xidmətlərin əsas maliyyə mənbəyi nədir?", options: [
    { id: "a", v: "tax",     text: "Əsasən ümumi vergilər." },
    { id: "b", v: "contrib", text: "Əsasən işçi və işəgötürənlərin sosial sığorta töhfələri." },
    { id: "c", v: "mixed",   text: "Vergilərin və sosial sığorta töhfələrinin birləşməsi." },
    { id: "d", v: "private", text: "Əsasən fərdi ödənişlər və özəl sığorta haqları; dövlət büdcəsinin payı məhduddur." }
  ]},
  5: { hint: "Sosial təminatdan kimlər yararlanır?", options: [
    { id: "a", v: "universal", text: "Bütün vətəndaşlar (universal əhatə)." },
    { id: "b", v: "work",      text: "İşləyənlər və onların ailələri (sığorta statusu əsasında)." },
    { id: "c", v: "targeted",  text: "Yalnız aztəminatlı və həssas qruplar." },
    { id: "d", v: "tiered",    text: "Əsas paket hamı üçün, əlavə paketlər status və ehtiyaca görə." }
  ]},
  6: { hint: "Uşaq və yaşlı baxımında ailənin və dövlətin payı necədir?", options: [
    { id: "a", v: "state",     text: "Uşaq və yaşlı baxımı xidmətlərini dövlət təşkil edir." },
    { id: "b", v: "supported", text: "Ailə əsas dayaqdır; dövlət ailə yardımları ilə onu dəstəkləyir." },
    { id: "c", v: "family",    text: "Ailə və icma əsas müdafiəçidir; dövlət tamamlayıcı rol oynayır." },
    { id: "d", v: "market",    text: "Baxım xidmətləri bazarda və icmada müxtəlif seçimlərlə təklif olunur; ailə dəstəyi könüllüdür." }
  ]},
  7: { hint: "Sosial rifah üçün məsuliyyətin nə qədəri fərdin üzərindədir?", options: [
    { id: "a", v: "low",    text: "Aşağı: sosial hüquqlar vətəndaşlıq əsasında verilir." },
    { id: "b", v: "mid",    text: "Orta: hüquqlar məşğulluq və töhfə ilə əlaqələndirilir." },
    { id: "c", v: "high",   text: "Yüksək: fərd əsas məsuliyyəti daşıyır, dövlət son çarə kimi dəstək verir." },
    { id: "d", v: "shared", text: "Paylaşılmış: fərd, ailə və dövlət məsuliyyəti bölüşür." }
  ]},
  8: { hint: "Vergi yükü və vergi bazası necə qurulur?", options: [
    { id: "a", v: "high",   text: "Yüksək və mütərəqqi vergilər." },
    { id: "b", v: "mid",    text: "Orta səviyyəli vergilər + sosial sığorta töhfələri." },
    { id: "c", v: "low",    text: "Aşağı vergilər, məhdud sosial xərclər." },
    { id: "d", v: "formal", text: "Orta səviyyəli vergilər; vergi bazası qeyri-rəsmi sektorun rəsmiləşdirilməsi hesabına genişləndirilir." }
  ]},
  9: { hint: "Yardımlar kimə və hansı qaydada verilir?", options: [
    { id: "a", v: "universal", text: "Hamıya verilən universal müavinətlər." },
    { id: "b", v: "status",    text: "Peşə statusu və töhfələrə bağlı müavinətlər." },
    { id: "c", v: "targeted",  text: "Yalnız ehtiyac meyarına görə hədəfli yardım." },
    { id: "d", v: "digital",   text: "Hədəfli yardım + rəqəmsal (e-xidmət) ünvanlı yardım sistemi." }
  ]},
  10: { hint: "Dövlət məşğulluğu və əmək bazarını necə dəstəkləyir?", options: [
    { id: "a", v: "active",     text: "Aktiv məşğulluq siyasəti: işsizlik yardımı + yenidənhazırlıq + işə qayıdış dəstəyi." },
    { id: "b", v: "corp",       text: "Peşə statusuna əsaslanan müdafiə və sosial tərəfdaşlarla razılaşmalar." },
    { id: "c", v: "flex",       text: "Çevik əmək bazarı, minimal tənzimləmə; yardım işə qayıdışı stimullaşdırır." },
    { id: "d", v: "formalize",  text: "Qeyri-rəsmi məşğulluğun rəsmiləşdirilməsi və özünü məşğul edənlərin müdafiəyə cəlb olunması." }
  ]},
  11: { hint: "Bərabərsizliyə qarşı hansı yanaşma seçilir?", options: [
    { id: "a", v: "reduce",   text: "Yenidənpaylama ilə bərabərsizliyin əhəmiyyətli azaldılması." },
    { id: "b", v: "status",   text: "Status fərqləri qismən qorunur, hamı üçün minimum təminatla." },
    { id: "c", v: "market",   text: "Bazar nəticələri qəbul edilir; yalnız yoxsulluq həddindən aşağıda dəstək verilir." },
    { id: "d", v: "targeted", text: "Region və qrup fərqlərinə yönəlik hədəfli proqramlar." }
  ]},
  12: { hint: "Modelinizi qurarkən hansı ölkə təcrübələrindən ilham aldınız? (1–3 seçim)", multi: true, max: 3, options: [
    { id: "a", text: "Skandinaviya təcrübəsi (İsveç, Norveç, Danimarka)" },
    { id: "b", text: "Anglo-Sakson təcrübəsi (ABŞ, Böyük Britaniya, Kanada)" },
    { id: "c", text: "Mərkəzi Avropa təcrübəsi (Almaniya, Avstriya, Belçika)" },
    { id: "d", text: "Aralıq dənizi ölkələrinin təcrübəsi (İtaliya, İspaniya, Portuqaliya, Yunanıstan)" },
    { id: "e", text: "Baltikyanı ölkələrin islahat təcrübəsi (Estoniya, Latviya, Litva)" },
    { id: "f", text: "Konkret ölkə nümunəsi yoxdur: tamamilə orijinal yanaşma", exclusive: true }
  ]}
};

/* ---------- 9. Modeldaxili məntiqi uyğunluq meyarları (10 bal) ----------
   Yalnız daxili ziddiyyətlər yoxlanılır. Klassik modellərdən fərqlənmək və ya
   hibrid model qurmaq cəza almır. v(n) — n-ci göstərici üzrə seçilmiş variantın «v» dəyəri. */
const LOGIC_RULES = [
  { id: "R1", points: 2, title: "Maliyyə mənbəyi ↔ təminatın genişliyi", involves: [2, 3, 4, 5, 8, 9, 11],
    violated: function (v) {
      const gen = (v(2) === "universal") + (v(3) === "universal") + (v(5) === "universal") + (v(9) === "universal") + (v(11) === "reduce");
      return gen >= 3 && (v(4) === "private" || v(8) === "low");
    },
    okText: "Təminatın genişliyi ilə maliyyə mənbəyi bir-birinə uyğundur.",
    failText: "Üç və daha çox göstərici geniş (universal/yenidənpaylayıcı) seçilib, lakin maliyyələşmə fərdi ödənişlərə və ya aşağı vergilərə söykənir. Resurs mənbəyi aydın deyil." },
  { id: "R2", points: 2, title: "Dövlətin rolu ↔ əhatə və maliyyələşmə", involves: [1, 3, 4, 5],
    violated: function (v) {
      return (v(1) === "low" && (v(5) === "universal" || v(3) === "universal")) || (v(1) === "high" && v(4) === "private");
    },
    okText: "Dövlətin seçilmiş rolu əhatə və maliyyələşmə ilə uyğunlaşır.",
    failText: "Dövlətin rolu ilə təminatın əhatəsi/maliyyələşməsi bir-birini istisna edir (məsələn, «dövlət yalnız həssas qrupları dəstəkləyir» və eyni zamanda universal əhatə, yaxud «dövlət əsas təminatçıdır» və eyni zamanda yalnız fərdi ödənişlər)." },
  { id: "R3", points: 2, title: "Fərdi məsuliyyət ↔ hüquqların xarakteri", involves: [4, 5, 7, 9],
    violated: function (v) {
      return (v(7) === "high" && (v(5) === "universal" || v(9) === "universal")) || (v(7) === "low" && v(4) === "private");
    },
    okText: "Fərdi məsuliyyət səviyyəsi hüquqların xarakteri ilə uyğundur.",
    failText: "Fərdin məsuliyyəti ilə hüquqların xarakteri ziddiyyət təşkil edir (məsələn, yüksək fərdi məsuliyyət və universal müavinətlər, yaxud vətəndaşlıq əsaslı hüquqlar və yalnız fərdi ödənişlərlə maliyyə)." },
  { id: "R4", points: 2, title: "Ailə ↔ dövlət xidmətləri", involves: [1, 6, 8],
    violated: function (v) { return v(6) === "state" && (v(1) === "low" || v(8) === "low"); },
    okText: "Ailə və dövlət xidmətləri arasındakı bölgü məntiqlidir.",
    failText: "Baxım xidmətlərini dövlətin təşkil etməsi seçilib, lakin dövlətin rolu minimal və ya vergilər aşağı saxlanılır. Xidmətin resursu göstərilməyib." },
  { id: "R5", points: 2, title: "Məşğulluq və bərabərsizlik hədəfləri ↔ resurslar", involves: [4, 8, 10, 11],
    violated: function (v) {
      return (v(10) === "active" && (v(8) === "low" || v(4) === "private")) || (v(11) === "reduce" && (v(8) === "low" || v(4) === "private"));
    },
    okText: "Seçilmiş hədəflər üçün resurs mənbəyi nəzərdə tutulub.",
    failText: "Aktiv məşğulluq siyasəti və ya əhəmiyyətli yenidənpaylama hədəflənib, lakin vergilər aşağı saxlanılır və ya maliyyələşmə fərdi ödənişlərə söykənir." }
];
