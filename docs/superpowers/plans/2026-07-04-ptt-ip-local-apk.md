# PTT IP Local APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Android APK that searches a PTT username, fetches public PTT-visible records on demand, extracts visible source IPs, and displays post/IP/shared-IP evidence without GitHub, a server, or a cloud database.

**Architecture:** Native Android app with a small domain layer for fetch/parse/analyze/cache. The first vertical slice uses one public source, parses post metadata and visible IPs, stores recent search results locally, and renders tabs for records and IPs.

**Tech Stack:** Kotlin, Android Gradle Plugin, Jetpack Compose, OkHttp, Jsoup, Room/SQLite, kotlinx.coroutines, JUnit.

---

## File Structure

- `settings.gradle.kts`: Gradle project settings.
- `build.gradle.kts`: root plugin versions.
- `gradle.properties`: Android/Kotlin build options.
- `app/build.gradle.kts`: Android app module dependencies.
- `app/src/main/AndroidManifest.xml`: app manifest and internet permission.
- `app/src/main/java/com/skillgodak/pttip/MainActivity.kt`: Compose app entry point.
- `app/src/main/java/com/skillgodak/pttip/ui/SearchScreen.kt`: search input, loading state, result tabs.
- `app/src/main/java/com/skillgodak/pttip/domain/PttModels.kt`: domain data classes.
- `app/src/main/java/com/skillgodak/pttip/domain/PttRepository.kt`: orchestrates cache, fetch, parse, and analysis.
- `app/src/main/java/com/skillgodak/pttip/net/PttFetcher.kt`: network fetching interface and implementation.
- `app/src/main/java/com/skillgodak/pttip/parse/PttHtmlParser.kt`: HTML parsing and IP extraction.
- `app/src/main/java/com/skillgodak/pttip/analysis/SharedIpAnalyzer.kt`: builds IP-to-user evidence links from parsed records.
- `app/src/main/java/com/skillgodak/pttip/cache/AppDatabase.kt`: Room database.
- `app/src/main/java/com/skillgodak/pttip/cache/PttDao.kt`: cache queries.
- `app/src/main/java/com/skillgodak/pttip/cache/CacheEntities.kt`: Room entities.
- `app/src/test/java/com/skillgodak/pttip/parse/PttHtmlParserTest.kt`: parser unit tests.
- `app/src/test/java/com/skillgodak/pttip/analysis/SharedIpAnalyzerTest.kt`: analysis unit tests.

## Task 1: Android Project Skeleton

**Files:**
- Create: `settings.gradle.kts`
- Create: `build.gradle.kts`
- Create: `gradle.properties`
- Create: `app/build.gradle.kts`
- Create: `app/src/main/AndroidManifest.xml`
- Create: `app/src/main/java/com/skillgodak/pttip/MainActivity.kt`

- [ ] **Step 1: Create Gradle settings**

Create `settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PTT IP"
include(":app")
```

- [ ] **Step 2: Create root build file**

Create `build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    id("com.google.devtools.ksp") version "2.0.21-1.0.27" apply false
}
```

- [ ] **Step 3: Create Gradle properties**

Create `gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

- [ ] **Step 4: Create app build file**

Create `app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.skillgodak.pttip"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.skillgodak.pttip"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jsoup:jsoup:1.18.3")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
}
```

- [ ] **Step 5: Create manifest**

Create `app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:label="PTT IP"
        android:supportsRtl="true"
        android:theme="@style/Theme.PttIp">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 6: Create starter activity**

Create `app/src/main/java/com/skillgodak/pttip/MainActivity.kt`:

```kotlin
package com.skillgodak.pttip

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.skillgodak.pttip.ui.SearchScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    SearchScreen()
                }
            }
        }
    }
}
```

- [ ] **Step 7: Verify skeleton**

Run:

```powershell
.\gradlew.bat :app:assembleDebug
```

Expected: if Android SDK and Gradle wrapper are present, build succeeds and produces `app/build/outputs/apk/debug/app-debug.apk`. If `gradlew.bat` is missing, install or generate a Gradle wrapper before continuing.

## Task 2: Domain Models

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/domain/PttModels.kt`

- [ ] **Step 1: Create domain models**

Create `PttModels.kt`:

```kotlin
package com.skillgodak.pttip.domain

data class PttSearchResult(
    val userId: String,
    val posts: List<PostRecord>,
    val replies: List<ReplyRecord>,
    val ips: List<IpRecord>,
    val sharedIpLinks: List<SharedIpLink>,
    val fromCache: Boolean,
)

data class PostRecord(
    val board: String,
    val title: String,
    val author: String,
    val url: String,
    val dateText: String,
    val sourceIp: String?,
)

data class ReplyRecord(
    val board: String,
    val articleUrl: String,
    val userId: String,
    val type: ReplyType,
    val content: String,
    val dateText: String?,
)

enum class ReplyType {
    PUSH,
    BOO,
    NEUTRAL,
}

data class IpRecord(
    val ip: String,
    val countryHint: String?,
    val firstSeenText: String,
    val lastSeenText: String,
    val evidenceUrls: List<String>,
)

data class SharedIpLink(
    val otherUserId: String,
    val sharedIp: String,
    val evidenceCount: Int,
    val evidenceUrls: List<String>,
)
```

- [ ] **Step 2: Add a compile check**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest
```

Expected: build reaches test execution with no unresolved model symbols.

## Task 3: HTML Parser

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/parse/PttHtmlParser.kt`
- Create: `app/src/test/java/com/skillgodak/pttip/parse/PttHtmlParserTest.kt`

- [ ] **Step 1: Write parser tests**

Create `PttHtmlParserTest.kt`:

```kotlin
package com.skillgodak.pttip.parse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PttHtmlParserTest {
    private val parser = PttHtmlParser()

    @Test
    fun parsesPostWithVisibleIp() {
        val html = """
            <html><body>
              <span class="article-meta-tag">作者</span>
              <span class="article-meta-value">testid (Tester)</span>
              <span class="article-meta-tag">標題</span>
              <span class="article-meta-value">[問卦] test title</span>
              <span class="article-meta-tag">時間</span>
              <span class="article-meta-value">Sat Jul  4 12:00:00 2026</span>
              <span class="f2">※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 180.214.182.79 (臺灣)</span>
            </body></html>
        """.trimIndent()

        val post = parser.parsePost(
            board = "Gossiping",
            url = "https://www.ptt.cc/bbs/Gossiping/M.1.A.html",
            html = html
        )

        assertEquals("Gossiping", post.board)
        assertEquals("testid", post.author)
        assertEquals("[問卦] test title", post.title)
        assertEquals("Sat Jul  4 12:00:00 2026", post.dateText)
        assertEquals("180.214.182.79", post.sourceIp)
    }

    @Test
    fun returnsNullIpWhenIpIsMissing() {
        val html = """
            <html><body>
              <span class="article-meta-tag">作者</span>
              <span class="article-meta-value">testid (Tester)</span>
              <span class="article-meta-tag">標題</span>
              <span class="article-meta-value">No IP</span>
              <span class="article-meta-tag">時間</span>
              <span class="article-meta-value">Sat Jul  4 12:00:00 2026</span>
            </body></html>
        """.trimIndent()

        val post = parser.parsePost("Gossiping", "https://example.test", html)

        assertNull(post.sourceIp)
    }
}
```

- [ ] **Step 2: Run failing parser tests**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests com.skillgodak.pttip.parse.PttHtmlParserTest
```

Expected: FAIL because `PttHtmlParser` does not exist.

- [ ] **Step 3: Implement parser**

Create `PttHtmlParser.kt`:

```kotlin
package com.skillgodak.pttip.parse

import com.skillgodak.pttip.domain.PostRecord
import org.jsoup.Jsoup

class PttHtmlParser {
    private val ipRegex = Regex("""(?:來自|from):\s*([0-9]{1,3}(?:\.[0-9]{1,3}){3})""")

    fun parsePost(board: String, url: String, html: String): PostRecord {
        val document = Jsoup.parse(html)
        val metaValues = document.select(".article-meta-value").map { it.text() }
        val author = metaValues.getOrNull(0)
            ?.substringBefore(" ")
            ?.trim()
            .orEmpty()
        val title = metaValues.getOrNull(1).orEmpty()
        val dateText = metaValues.getOrNull(2).orEmpty()
        val sourceIp = ipRegex.find(document.text())?.groupValues?.getOrNull(1)

        return PostRecord(
            board = board,
            title = title,
            author = author,
            url = url,
            dateText = dateText,
            sourceIp = sourceIp,
        )
    }
}
```

- [ ] **Step 4: Run parser tests**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests com.skillgodak.pttip.parse.PttHtmlParserTest
```

Expected: PASS.

## Task 4: Shared-IP Analyzer

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/analysis/SharedIpAnalyzer.kt`
- Create: `app/src/test/java/com/skillgodak/pttip/analysis/SharedIpAnalyzerTest.kt`

- [ ] **Step 1: Write analyzer tests**

Create `SharedIpAnalyzerTest.kt`:

```kotlin
package com.skillgodak.pttip.analysis

import com.skillgodak.pttip.domain.PostRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SharedIpAnalyzerTest {
    private val analyzer = SharedIpAnalyzer()

    @Test
    fun findsOtherUsersWithSameIp() {
        val posts = listOf(
            post(author = "target", ip = "1.2.3.4", url = "https://a"),
            post(author = "other", ip = "1.2.3.4", url = "https://b"),
            post(author = "third", ip = "5.6.7.8", url = "https://c"),
        )

        val links = analyzer.findSharedIpLinks(targetUserId = "target", posts = posts)

        assertEquals(1, links.size)
        assertEquals("other", links.single().otherUserId)
        assertEquals("1.2.3.4", links.single().sharedIp)
        assertEquals(1, links.single().evidenceCount)
        assertTrue(links.single().evidenceUrls.contains("https://b"))
    }

    private fun post(author: String, ip: String?, url: String) = PostRecord(
        board = "Gossiping",
        title = "title",
        author = author,
        url = url,
        dateText = "Sat Jul  4 12:00:00 2026",
        sourceIp = ip,
    )
}
```

- [ ] **Step 2: Run failing analyzer tests**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests com.skillgodak.pttip.analysis.SharedIpAnalyzerTest
```

Expected: FAIL because `SharedIpAnalyzer` does not exist.

- [ ] **Step 3: Implement analyzer**

Create `SharedIpAnalyzer.kt`:

```kotlin
package com.skillgodak.pttip.analysis

import com.skillgodak.pttip.domain.PostRecord
import com.skillgodak.pttip.domain.SharedIpLink

class SharedIpAnalyzer {
    fun findSharedIpLinks(targetUserId: String, posts: List<PostRecord>): List<SharedIpLink> {
        val targetIps = posts
            .filter { it.author.equals(targetUserId, ignoreCase = true) }
            .mapNotNull { it.sourceIp }
            .toSet()

        return posts
            .filter { it.sourceIp in targetIps }
            .filterNot { it.author.equals(targetUserId, ignoreCase = true) }
            .groupBy { it.author to it.sourceIp.orEmpty() }
            .map { (key, evidencePosts) ->
                SharedIpLink(
                    otherUserId = key.first,
                    sharedIp = key.second,
                    evidenceCount = evidencePosts.size,
                    evidenceUrls = evidencePosts.map { it.url }.distinct(),
                )
            }
            .sortedWith(compareByDescending<SharedIpLink> { it.evidenceCount }.thenBy { it.otherUserId })
    }
}
```

- [ ] **Step 4: Run analyzer tests**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests com.skillgodak.pttip.analysis.SharedIpAnalyzerTest
```

Expected: PASS.

## Task 5: Network Fetcher

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/net/PttFetcher.kt`

- [ ] **Step 1: Create fetcher interface and OkHttp implementation**

Create `PttFetcher.kt`:

```kotlin
package com.skillgodak.pttip.net

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

interface PttFetcher {
    suspend fun fetch(url: String): String
}

class OkHttpPttFetcher(
    private val client: OkHttpClient = OkHttpClient(),
) : PttFetcher {
    override suspend fun fetch(url: String): String = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 PTT-IP-Android/0.1")
            .header("Cookie", "over18=1")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                error("HTTP ${response.code}: $url")
            }
            response.body?.string().orEmpty()
        }
    }
}
```

- [ ] **Step 2: Compile**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest
```

Expected: PASS.

## Task 6: Local Cache

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/cache/CacheEntities.kt`
- Create: `app/src/main/java/com/skillgodak/pttip/cache/PttDao.kt`
- Create: `app/src/main/java/com/skillgodak/pttip/cache/AppDatabase.kt`

- [ ] **Step 1: Create cache entities**

Create `CacheEntities.kt`:

```kotlin
package com.skillgodak.pttip.cache

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_posts")
data class CachedPostEntity(
    @PrimaryKey val url: String,
    val searchedUserId: String,
    val board: String,
    val title: String,
    val author: String,
    val dateText: String,
    val sourceIp: String?,
    val cachedAtMillis: Long,
)
```

- [ ] **Step 2: Create DAO**

Create `PttDao.kt`:

```kotlin
package com.skillgodak.pttip.cache

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface PttDao {
    @Query("SELECT * FROM cached_posts WHERE searchedUserId = :userId ORDER BY dateText DESC")
    suspend fun postsForUser(userId: String): List<CachedPostEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPosts(posts: List<CachedPostEntity>)
}
```

- [ ] **Step 3: Create Room database**

Create `AppDatabase.kt`:

```kotlin
package com.skillgodak.pttip.cache

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [CachedPostEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun pttDao(): PttDao

    companion object {
        fun create(context: Context): AppDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "ptt-ip.db",
            ).build()
        }
    }
}
```

- [ ] **Step 4: Compile Room code**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest
```

Expected: PASS.

## Task 7: Repository Vertical Slice

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/domain/PttRepository.kt`

- [ ] **Step 1: Create repository**

Create `PttRepository.kt`:

```kotlin
package com.skillgodak.pttip.domain

import com.skillgodak.pttip.analysis.SharedIpAnalyzer
import com.skillgodak.pttip.cache.CachedPostEntity
import com.skillgodak.pttip.cache.PttDao
import com.skillgodak.pttip.net.PttFetcher
import com.skillgodak.pttip.parse.PttHtmlParser

class PttRepository(
    private val dao: PttDao,
    private val fetcher: PttFetcher,
    private val parser: PttHtmlParser = PttHtmlParser(),
    private val analyzer: SharedIpAnalyzer = SharedIpAnalyzer(),
) {
    suspend fun searchUser(userId: String, articleUrls: List<String>): PttSearchResult {
        val cachedPosts = dao.postsForUser(userId).map { it.toPostRecord() }
        if (cachedPosts.isNotEmpty()) {
            return buildResult(userId, cachedPosts, fromCache = true)
        }

        val fetchedPosts = articleUrls.mapNotNull { url ->
            runCatching {
                val board = url.substringAfter("/bbs/").substringBefore("/")
                parser.parsePost(board = board, url = url, html = fetcher.fetch(url))
            }.getOrNull()
        }

        dao.upsertPosts(fetchedPosts.map { it.toEntity(userId) })
        return buildResult(userId, fetchedPosts, fromCache = false)
    }

    private fun buildResult(userId: String, posts: List<PostRecord>, fromCache: Boolean): PttSearchResult {
        val ipRecords = posts
            .mapNotNull { post ->
                post.sourceIp?.let { ip ->
                    IpRecord(
                        ip = ip,
                        countryHint = null,
                        firstSeenText = post.dateText,
                        lastSeenText = post.dateText,
                        evidenceUrls = listOf(post.url),
                    )
                }
            }
            .groupBy { it.ip }
            .map { (ip, records) ->
                IpRecord(
                    ip = ip,
                    countryHint = null,
                    firstSeenText = records.first().firstSeenText,
                    lastSeenText = records.last().lastSeenText,
                    evidenceUrls = records.flatMap { it.evidenceUrls }.distinct(),
                )
            }

        return PttSearchResult(
            userId = userId,
            posts = posts,
            replies = emptyList(),
            ips = ipRecords,
            sharedIpLinks = analyzer.findSharedIpLinks(userId, posts),
            fromCache = fromCache,
        )
    }

    private fun CachedPostEntity.toPostRecord() = PostRecord(
        board = board,
        title = title,
        author = author,
        url = url,
        dateText = dateText,
        sourceIp = sourceIp,
    )

    private fun PostRecord.toEntity(searchedUserId: String) = CachedPostEntity(
        url = url,
        searchedUserId = searchedUserId,
        board = board,
        title = title,
        author = author,
        dateText = dateText,
        sourceIp = sourceIp,
        cachedAtMillis = System.currentTimeMillis(),
    )
}
```

- [ ] **Step 2: Compile repository**

Run:

```powershell
.\gradlew.bat :app:testDebugUnitTest
```

Expected: PASS.

## Task 8: Compose Search UI

**Files:**
- Create: `app/src/main/java/com/skillgodak/pttip/ui/SearchScreen.kt`

- [ ] **Step 1: Create UI with sample local state**

Create `SearchScreen.kt`:

```kotlin
package com.skillgodak.pttip.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Divider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.skillgodak.pttip.domain.IpRecord
import com.skillgodak.pttip.domain.PostRecord
import com.skillgodak.pttip.domain.PttSearchResult

@Composable
fun SearchScreen() {
    var query by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    var result by remember { mutableStateOf(sampleResult()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("發現 PTT")
        Spacer(Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("使用者名稱") },
                modifier = Modifier.weight(1f),
            )
            Button(
                onClick = { result = sampleResult(query.ifBlank { "a22663564" }) },
                modifier = Modifier.padding(start = 8.dp),
            ) {
                Text("查詢")
            }
        }
        Spacer(Modifier.height(12.dp))
        TabRow(selectedTabIndex = selectedTab) {
            listOf("發文", "來源 IP", "關係").forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) },
                )
            }
        }
        when (selectedTab) {
            0 -> PostList(result.posts)
            1 -> IpList(result.ips)
            else -> SharedIpNotice()
        }
    }
}

@Composable
private fun PostList(posts: List<PostRecord>) {
    LazyColumn {
        items(posts) { post ->
            Column(Modifier.padding(vertical = 10.dp)) {
                Text(post.title)
                Text("${post.board} / ${post.dateText}")
                Text("IP: ${post.sourceIp ?: "無公開來源 IP"}")
            }
            Divider()
        }
    }
}

@Composable
private fun IpList(ips: List<IpRecord>) {
    LazyColumn {
        items(ips) { ip ->
            Column(Modifier.padding(vertical = 10.dp)) {
                Text(ip.ip)
                Text("${ip.firstSeenText} - ${ip.lastSeenText}")
                Text("${ip.evidenceUrls.size} 筆證據")
            }
            Divider()
        }
    }
}

@Composable
private fun SharedIpNotice() {
    Text(
        text = "共同 IP 只代表線索，不代表同一人。公共 Wi-Fi、公司、學校、VPN、電信 NAT 都可能造成共用 IP。",
        modifier = Modifier.padding(top = 16.dp),
    )
}

private fun sampleResult(userId: String = "a22663564") = PttSearchResult(
    userId = userId,
    posts = listOf(
        PostRecord(
            board = "Gossiping",
            title = "[問卦] 測試文章",
            author = userId,
            url = "https://www.ptt.cc/bbs/Gossiping/M.1.A.html",
            dateText = "Sat Jul  4 12:00:00 2026",
            sourceIp = "180.214.182.79",
        )
    ),
    replies = emptyList(),
    ips = listOf(
        IpRecord(
            ip = "180.214.182.79",
            countryHint = "TW",
            firstSeenText = "Sat Jul  4 12:00:00 2026",
            lastSeenText = "Sat Jul  4 12:00:00 2026",
            evidenceUrls = listOf("https://www.ptt.cc/bbs/Gossiping/M.1.A.html"),
        )
    ),
    sharedIpLinks = emptyList(),
    fromCache = false,
)
```

- [ ] **Step 2: Build APK**

Run:

```powershell
.\gradlew.bat :app:assembleDebug
```

Expected: PASS and a debug APK at `app/build/outputs/apk/debug/app-debug.apk`.

## Task 9: Connect Real Search

**Files:**
- Modify: `app/src/main/java/com/skillgodak/pttip/ui/SearchScreen.kt`
- Create: `app/src/main/java/com/skillgodak/pttip/ui/SearchViewModel.kt`

- [ ] **Step 1: Create ViewModel state**

Create `SearchViewModel.kt`:

```kotlin
package com.skillgodak.pttip.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skillgodak.pttip.domain.PttSearchResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val loading: Boolean = false,
    val result: PttSearchResult? = null,
    val error: String? = null,
)

class SearchViewModel : ViewModel() {
    private val mutableState = MutableStateFlow(SearchUiState())
    val state: StateFlow<SearchUiState> = mutableState.asStateFlow()

    fun updateQuery(query: String) {
        mutableState.value = mutableState.value.copy(query = query)
    }

    fun search() {
        val query = mutableState.value.query.trim()
        if (query.isEmpty()) {
            mutableState.value = mutableState.value.copy(error = "請輸入使用者名稱")
            return
        }

        viewModelScope.launch {
            mutableState.value = mutableState.value.copy(loading = true, error = null)
            mutableState.value = mutableState.value.copy(
                loading = false,
                error = "真實搜尋來源尚未接上；目前先完成 UI、解析器與快取骨架。",
            )
        }
    }
}
```

- [ ] **Step 2: Replace local UI state with ViewModel state**

Modify `SearchScreen.kt` so `SearchScreen()` uses `viewModel<SearchViewModel>()`, collects `state`, calls `updateQuery`, and calls `search()`. Keep the sample list rendering until the real source URL discovery is implemented.

Expected key code:

```kotlin
val viewModel: SearchViewModel = viewModel()
val state by viewModel.state.collectAsState()
```

- [ ] **Step 3: Build**

Run:

```powershell
.\gradlew.bat :app:assembleDebug
```

Expected: PASS.

## Task 10: Manual Verification

**Files:**
- No source changes required unless verification finds a bug.

- [ ] **Step 1: Install debug APK**

Run:

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Expected: `Success`.

- [ ] **Step 2: Test core UI**

Open the app and verify:

- The app launches as `PTT IP`.
- The username field accepts input.
- The search button responds.
- Tabs switch between 發文, 來源 IP, and 關係.
- The shared-IP warning is visible in the 關係 tab.

- [ ] **Step 3: Record gaps**

If real PTT URL discovery is not complete, record it as the next implementation item before claiming the app can search live PTT data.

## Self-Review

- Spec coverage: The plan covers local-only APK, no GitHub dependency, no server dependency, no user-written SQL, public-data-only parsing, visible IP display, cache foundation, and a warning that shared IP is not proof of multi-account ownership.
- Known gap: The first vertical slice intentionally does not yet solve broad PTT username-to-article URL discovery. Task 9 marks that real source discovery still needs implementation before live ID search is complete.
- Placeholder scan: No unfinished `TBD`, `TODO`, or `FIXME` markers are used.
- Type consistency: `PttSearchResult`, `PostRecord`, `IpRecord`, and `SharedIpLink` names match across model, parser, analyzer, repository, and UI tasks.
