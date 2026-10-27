package com.masterplay.kekechallenge

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineView: LinearLayout
    private lateinit var btnRetry: Button

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var backPressedTime: Long = 0

    companion object {
        // Production App URL hosted on AI Studio / Cloud Run
        const val APP_URL = "https://ais-pre-mcmy6q6unumsormguko4p7-703711621275.us-west2.run.app"
    }

    // Modern ActivityResult launcher for file/image chooser (NatCash receipts & user avatars)
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback == null) return@registerForActivityResult

        val results: Array<Uri>? = when {
            result.resultCode == RESULT_OK && result.data?.data != null -> {
                arrayOf(result.data!!.data!!)
            }
            result.resultCode == RESULT_OK && result.data?.clipData != null -> {
                val clipData = result.data!!.clipData!!
                Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
            }
            else -> null
        }

        filePathCallback?.onReceiveValue(results)
        filePathCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        offlineView = findViewById(R.id.offlineView)
        btnRetry = findViewById(R.id.btnRetry)

        // Setup Back Button Navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    if (System.currentTimeMillis() - backPressedTime < 2000) {
                        finish()
                    } else {
                        backPressedTime = System.currentTimeMillis()
                        Toast.makeText(this@MainActivity, getString(R.string.toast_exit), Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })

        setupWebView()
        setupSwipeRefresh()

        btnRetry.setOnClickListener {
            offlineView.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.reload()
        }

        // Load the application
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(APP_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.mediaPlaybackRequiresUserGesture = false // Sound effects for Mini-games and Avion Crash

        // Cache configuration for fast mobile gaming
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = true
        }

        // Mobile User Agent suffix for app detection
        settings.userAgentString = settings.userAgentString + " MasterPlayAndroidApp/1.0.0"

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                offlineView.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                errorCode: Int,
                description: String?,
                failingUrl: String?
            ) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                if (errorCode == ERROR_HOST_LOOKUP || errorCode == ERROR_CONNECT || errorCode == ERROR_TIMEOUT) {
                    webView.visibility = View.GONE
                    offlineView.visibility = View.VISIBLE
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // External intents: WhatsApp, Phone calls, NatCash app, Telegram
                if (url.startsWith("tel:") || url.startsWith("whatsapp:") ||
                    url.startsWith("mailto:") || url.startsWith("intent:") ||
                    url.startsWith("market:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: ActivityNotFoundException) {
                        return false
                    }
                }

                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                }
            }

            // File Chooser for Photo uploads (receipts, profile avatar)
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }

                try {
                    filePickerLauncher.launch(Intent.createChooser(intent, "Chwazi yon foto"))
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }

                return true
            }

            // Camera / Audio permission handling
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(R.color.amber_primary, R.color.emerald_win)
        swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.bg_card)
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }
}
