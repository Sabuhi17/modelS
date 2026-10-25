# Welfare State Simulator — Rifah Dövləti Qurucusu

«Mövzu 5. Sosial siyasətin modelləri» dərs materialı əsasında hazırlanmış fərdi tədris oyunu. Tələbə əvvəlcə dörd sosial siyasət modelinin xüsusiyyətlərini təsnif edir, sonra öz ölkəsi üçün yeni model qurur. Oyun tam statikdir: server, API açarı, build prosesi və xarici kitabxana tələb olunmur. GitHub Pages-də işləyir.

## Fayllar

| Fayl | Məzmun |
|---|---|
| `index.html` | Səhifənin çərçivəsi (üst panel, taymer, bildirişlər) |
| `style.css` | Dizayn, mobil uyğunlaşma, çap/PDF üslubu |
| `data.js` | Kartlar, **cavab açarı və izahlar**, ikinci mərhələnin variantları, məntiqi uyğunluq qaydaları, parametrlər (`CONFIG`) |
| `script.js` | Oyun məntiqi: taymer, drag-and-drop, qiymətləndirmə, yaddaş, yekun səhifə, hesabat |
| `README.md` | Bu təlimat |

## GitHub Pages ilə yerləşdirmə (addım-addım)

1. [github.com](https://github.com) hesabınıza daxil olun və yuxarıdakı **+ → New repository** düyməsini basın.
2. Repozitoriyaya ad verin (məs., `welfare-state-simulator`), **Public** seçin və **Create repository** edin.
3. **uploading an existing file** linkinə keçin və beş faylı (`index.html`, `style.css`, `data.js`, `script.js`, `README.md`) qovluqsuz, birbaşa kökə yükləyin. **Commit changes** düyməsini basın.
4. Repozitoriyada **Settings → Pages** bölməsinə keçin.
5. **Build and deployment → Source** bölməsində **Deploy from a branch** seçin. **Branch** olaraq `main`, qovluq olaraq `/ (root)` seçib **Save** edin.
6. 1–2 dəqiqə gözləyin. Səhifənin yuxarısında ünvan görünəcək:
   `https://<istifadəçi-adı>.github.io/welfare-state-simulator/`
7. Bu ünvanı tələbələrlə paylaşın. Dəyişiklik etdikdə faylı yenidən yükləyib commit etmək kifayətdir.

Kompüterdə yoxlamaq üçün `index.html` faylını brauzerdə birbaşa açmaq da olar.

## Oyunun axını və vaxt

Ümumi vaxt 25 dəqiqədir və yuxarıdakı taymer mərhələlər arasında sıfırlanmır.

| Mərhələ | Vaxt | Bal |
|---|---|---|
| 1. Mövcud modelləri qur | 12 dəqiqə | 60 |
| 2. Öz rifah dövlətini yarat | 10 dəqiqə + birinci mərhələdən qalan vaxt | 40 |
| Yekunlaşdırma | 3 dəqiqə | — |

- Başlama vaxtı `localStorage`-da saxlanılır, qalan vaxt hər dəfə ondan hesablanır. Səhifəni yeniləmək taymeri sıfırlamır və əlavə vaxt qazandırmır. Cavablar da bərpa olunur.
- Birinci mərhələ 12-ci dəqiqədə avtomatik yoxlanılır və ikinci mərhələyə keçilir. Mərhələni tez bitirən iştirakçının qalan vaxtı itmir: ikinci mərhələ ümumi vaxtın 22-ci dəqiqəsinə qədər davam edir.
- 22-ci dəqiqədə cari məlumatlar saxlanılır və yekun nəticə səhifəsi açılır. Doldurulmayan hissələr «tamamlanmamış» kimi ayrıca göstərilir.

## Qiymətləndirmə

**Birinci mərhələ (60 bal).** 48 kart (4 model × 12 göstərici). Hər düzgün cavab 1,25 baldır. Yerləşdirilməyən kart səhv sayılmır, ayrıca «tamamlanmamış» kimi göstərilir.

**İkinci mərhələ (40 bal).**

| Meyar | Bal | Necə hesablanır |
|---|---|---|
| 12 göstəricinin tamamlanması | 20 | Doldurulan göstərici sayı ÷ 12 × 20 |
| Seçimlərin məntiqi uyğunluğu | 10 | 5 meyar × 2 bal (aşağıya bax) |
| Modelin əsaslandırılması | 10 | **Avtomatik verilmir.** Hesabatda müəllim üçün bal sahəsi var |

Məntiqi uyğunluq yalnız **daxili ziddiyyətləri** yoxlayır. Klassik modellərdən fərqli seçim və hibrid model xal itirmir. Meyarlar (`data.js` → `LOGIC_RULES`):

1. Maliyyə mənbəyi ↔ təminatın genişliyi (geniş təminat, lakin resurs mənbəyi yoxdur).
2. Dövlətin rolu ↔ əhatə və maliyyələşmə.
3. Fərdi məsuliyyət ↔ hüquqların xarakteri.
4. Ailə ↔ dövlət xidmətləri.
5. Məşğulluq və bərabərsizlik hədəfləri ↔ resurslar.

Müəllim balı hesabatdakı sahəyə yazılanda ümumi bal dərhal yenilənir. Hesabat çap edildikdə həmin bal və qeydlər də çapa düşür.

## Cavab açarı və mənbə

Cavab açarı `data.js` faylında `ANSWER_KEY` obyektində, kartlardan (`CARDS`) ayrı saxlanılır və interfeysdə əvvəlcədən göstərilmir. Hər cavabın `why` (izah) və `src` (mənbə bəndi) sahəsi var.

Material hər 48 xanə üçün birbaşa məlumat vermir. Hər kartın `basis` sahəsi bunu göstərir:

- `direct` — məlumat dərs materialında birbaşa yazılıb (39 kart);
- `interp` — material həmin göstəricini həmin model üçün ayrıca təsvir etmir, cavab modelin ümumi prinsiplərindən çıxarılıb (9 kart: `k07, k08, k10, k15, k22, k25, k27, k31, k32`).

`interp` kartlar rəy mərhələsində və hesabatda «interpretasiya» kimi qeyd olunur. Bu kartları yoxlayıb öz materialınıza uyğun düzəltmək üçün `data.js` faylındakı `_RAW` cədvəlinə baxın.

Yalnız birbaşa əsaslandırılan kartları saxlamaq üçün `data.js` faylında bunu dəyişin:

```js
ONLY_DIRECT_SOURCE: true
```

Bu halda 39 kart qalır və 60 bal onlar arasında bərabər bölünür (hər düzgün cavab ≈ 1,54 bal).

## Hesabat

Yekun səhifədə **Nəticəni yadda saxla** düyməsi ayrıca hesabat səhifəsini açır. Hesabatda bunlar var: iştirakçı, tarix və müddət, 4 model üzrə 12 göstərici və seçilmiş kartlar, düzgün/səhv/tamamlanmamış say, səhvlərin izahı, ölkə, model adı, yeni modelin cədvəli, əsaslandırma, yekun bal, müəllim sahəsi.

- **Ekran görüntüsü üçün hazırla** — interfeys elementlərini gizlədir, hesabatı sabit enlikdə göstərir. Çıxmaq üçün `Esc`.
- **Çap et / PDF kimi saxla** — brauzerin çap pəncərəsini açır. Orada «PDF kimi saxla» seçilir. Lazımsız interfeys elementləri çapda gizlədilir.
- **Yenidən başla** — təsdiqdən sonra bütün məlumatı silir.

## Məhdudiyyətlər

- Oyun statik saytdır: nəticələr yalnız iştirakçının brauzerinin `localStorage` yaddaşında saxlanılır. Tələbələrin nəticələrinin müəllim üçün mərkəzləşdirilmiş toplanması bu versiyada yoxdur. Tələbə hesabatı PDF və ya ekran görüntüsü kimi göndərir.
- Taymer iştirakçının cihaz saatına əsaslanır. Cihaz saatını dəyişmək və ya brauzer yaddaşını əl ilə silmək vaxtı manipulyasiya edə bilər. Server olmadığı üçün bunun qarşısını tam almaq mümkün deyil.
- Cavab açarı brauzerə yüklənən JavaScript faylında olduğundan, texniki biliyi olan iştirakçı mənbə kodunu açıb baxa bilər. Nəzarətli imtahan üçün bu oyun uyğun deyil.
- Drag-and-drop kompüterdə işləyir. Telefon və planşetdə hər kartın altındakı rəngli model düymələri (SD, LB, KK, AD) istifadə olunur.

## Yoxlanılan hallar

Boş ad/soyad; yerləşdirilməyən kartlar (xəbərdarlıq və «tamamlanmamış» hesabı); yanlış modelə yerləşdirmə (izahla); kartın dəyişdirilməsi və dolu yerin əvəzlənməsi (təkrar kart olmur); səhifənin yenilənməsi (taymer və cavablar bərpa olunur); ölkənin, modelin adının və əsaslandırmanın boş olması (düymə passiv qalır, çatışmayanlar göstərilir); 12-ci dəqiqədə və 25-ci dəqiqədə vaxtın bitməsi; hesabatın açılması, ekran görüntüsü rejimi və çap görünüşü.
