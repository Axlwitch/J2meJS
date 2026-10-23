if (typeof isbatch === 'undefined') {
    var isbatch = false;
}

// ============================================================
//  KODE ASLI (JANGAN DIUBAH)
// ============================================================

if (!isbatch) {
  var GameListHtml = '';
  if (typeof GameList !== 'undefined') {
    for (var i = 0; i < GameList.length; i++) {
      var gameName = GameList[i]['name'];
      var jarName = GameList[i]['jarName'];
      var midletClassName = GameList[i]['midletClassName'];
      var picPath = GameList[i]['picPath'];
      var onClickFunc = "openJar('"+jarName+"','"+midletClassName+"');";
      GameListHtml += '<a class="game-card" href="javascript:void(0)" onclick="'+onClickFunc+'">' +
        '<div>' +
        '<img src="' + picPath + '" width="54px" height="54px"></img>' +
        '</div>' +
        '<span>' + gameName + '</span>' +
        '</a>';
    }
  }
  var gameListDiv = document.getElementById('gameListDiv');
  if (gameListDiv) {
    gameListDiv.innerHTML = GameListHtml;
  }
}

function refreshGameList() {
  if (typeof JARStore === 'undefined') return;

  JARStore.getAll().then(
    function(files) {
      var localjars = document.getElementById('localjars');
      var listLocalJarsUI = document.getElementById('listLocalJars');
      
      if (localjars) localjars.length = 0;
      if (listLocalJarsUI) listLocalJarsUI.innerHTML = '';

      if (files.length === 0) {
        if (localjars) localjars.options.add(new Option('No Project'));
        if (listLocalJarsUI) listLocalJarsUI.innerHTML = '<button type="button" class="btn-opt active">No Project</button>';
        return;
      }

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (localjars) localjars.options.add(new Option(f.jarName));

        // Generate Tombol UI untuk Local JARs
        if (listLocalJarsUI) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-opt';
          btn.textContent = f.jarName;
          btn.onclick = (function(idx, btnRef) {
            return function() { setOpt('localjars', idx, btnRef); };
          })(i, btn);
          listLocalJarsUI.appendChild(btn);
        }
      }

      var gameindex = config01.getValueByKey("gameindex");
      if (gameindex >= files.length) gameindex = files.length - 1;
      if (gameindex < 0) gameindex = 0;

      if (localjars) localjars.selectedIndex = gameindex;
      
      // Select tombol aktif di UI List
      if (listLocalJarsUI && listLocalJarsUI.children[gameindex]) {
        listLocalJarsUI.children[gameindex].classList.add('active');
      }
    },
    function(err) {
      console.log(err);
    }
  );
}

// FUNGSI JEMBATAN UNIVERSAL UNTUK MENGUBAH OPTION SEBAGAI BUTTON
function setOpt(selectId, index, btnElem) {
  var targetSelect = document.getElementById(selectId);
  if (targetSelect && targetSelect.options[index]) {
    targetSelect.selectedIndex = index;
    
    // Trigger fungsi onChange asli jika ada
    if (selectId === 'canvasSize') canvasSizeHandleChange();
    else if (selectId === 'gamepadSize') gamepadSizeHandleChange();
    else if (selectId === 'gameresize') gameresizeHandleChange();
    else if (selectId === 'enginemode') enginemodeOnclick();
    else if (selectId === 'localjars') localjarsHandleChange();
  }

  // Update Status Aktif Visual Tombol
  if (btnElem && btnElem.parentNode) {
    var siblings = btnElem.parentNode.querySelectorAll('.btn-opt');
    siblings.forEach(function(b) { b.classList.remove('active'); });
    btnElem.classList.add('active');
  }
}

function loadLocalJar() {
  var localjars = document.getElementById('localjars');
  if (!localjars || localjars.options.length == 0 || localjars.options[0].text === 'No Project') {
    alert("Please select or upload a JAR first!");
    return;
  }
  var jarname = localjars.options[localjars.selectedIndex].text;
  openJar(jarname, "", 1);
}

function deleteLocalJar() {
  var localjars = document.getElementById('localjars');
  if (!localjars || localjars.options.length == 0 || localjars.options[0].text === 'No Project') {
    alert("No JAR file to delete!");
    return;
  }
  var jarname = localjars.options[localjars.selectedIndex].text;
  let res = confirm('Delete ' + jarname + ' ?');
  if (res) {
    JARStore.deleteJar(jarname).then(
      function() {
        alert(jarname + " Deleted!");
        refreshGameList();
      },
      function(errname) {
        alert("Failed to delete " + errname);
      }
    );
  }
}

var onUploadFile = function(e) {
  const _files = e.target.files;
  if (_files.length == 0) return;

  const _file = _files[0];
  if (!_file.name.toLowerCase().endsWith('.jar')) {
    alert("JAR format only!");
    return;
  }
  const reader = new FileReader();
  reader.readAsArrayBuffer(_file);
  reader.onload = function(readRes) {
    JARStore.installJAR(_file.name, readRes.target.result).then(
      function() {
        alert(_file.name + " Installed!");
        refreshGameList();
      },
      function(errname) {
        alert("Failed: " + errname);
      }
    );
    document.getElementById("jarFileupload").value = null;
  }
}

function openLocalJar() {
  document.getElementById("jarFileupload").click();
}

function openJar(jarname, midletClassName, islocaljar) {
  var enginemode = document.getElementById('enginemode'); 
  var href = 'main.html?jars=jar/' + jarname + '&jad=&midletClassName=' + midletClassName;
  if (islocaljar) {
    href = 'main.html?localjar=' + jarname;
  }
  
  href += "&enginemode=" + enginemode.options[enginemode.selectedIndex].value; 

  var gamepadSize = document.getElementById('gamepadSize');
  var mvalue = gamepadSize.options[gamepadSize.selectedIndex].value;
  if (mvalue) {
    href += "&gamepadSize=" + mvalue;
    href += (gamepadSize.selectedIndex == 0) ? "&gamepad=0" : "&gamepad=1";
  }

  var canvasSize = document.getElementById('canvasSize');
  var mvalue = canvasSize.options[canvasSize.selectedIndex].value;
  if (mvalue) href += "&canvasSize=" + mvalue;

  var gameresize = document.getElementById('gameresize');
  var gameresizevalue = gameresize.options[gameresize.selectedIndex].value;
  if (gameresizevalue) href += "&gameresize=" + gameresizevalue;

  var localjars = document.getElementById('localjars');

  config01.setValueByKey("canvasSize", canvasSize.selectedIndex);
  config01.setValueByKey("gamepadSize", gamepadSize.selectedIndex);
  config01.setValueByKey("gameresize", gameresize.selectedIndex);
  config01.setValueByKey("enginemode", enginemode.selectedIndex);
  if (localjars) config01.setValueByKey("gameindex", localjars.selectedIndex);

  window.location.href = href;
}

var myconfig = function() {
  var myInfo = {
    canvasSize: 10,
    gamepadSize: 0,
    gameresize: 0,
    gameindex: 0,
    enginemode: 0
  };
  if (window.localStorage["my"] === undefined) {
    window.localStorage["my"] = JSON.stringify(myInfo);
  } else {
    var data = JSON.parse(window.localStorage["my"]);
    for (var key in data) myInfo[key] = data[key];
  }
  return {
    getValueByKey(key) { return myInfo[key]; },
    setValueByKey() {
      for (var i = 0; i < arguments.length; i += 2) {
        myInfo[arguments[i]] = arguments[i + 1];
      }
      window.localStorage["my"] = JSON.stringify(myInfo);
    }
  }
}

var config01 = new myconfig();

function canvasSizeHandleChange() {
  var canvasSize = document.getElementById('canvasSize');
  if (canvasSize) config01.setValueByKey("canvasSize", canvasSize.selectedIndex);
}

function gamepadSizeHandleChange() {
  var gamepadSize = document.getElementById('gamepadSize');
  if (gamepadSize) config01.setValueByKey("gamepadSize", gamepadSize.selectedIndex);
}

function gameresizeHandleChange() {
  var gameresize = document.getElementById('gameresize');
  if (gameresize) config01.setValueByKey("gameresize", gameresize.selectedIndex);
}

function localjarsHandleChange() {
  var localjars = document.getElementById('localjars');
  if (localjars) config01.setValueByKey("gameindex", localjars.selectedIndex);
}

function enginemodeOnclick() {
  var enginemodeckb = document.getElementById('enginemode');
  if (enginemodeckb) config01.setValueByKey("enginemode", enginemodeckb.selectedIndex);
} 

// Sync Pilihan Tombol saat Halaman Selesai Dimuat
window.addEventListener("load", function() {
  var csize = config01.getValueByKey("canvasSize");
  var gsize = config01.getValueByKey("gamepadSize");
  var gresize = config01.getValueByKey("gameresize");
  var enginemode = config01.getValueByKey("enginemode");

  // Sinkronkan elemen select tersembunyi
  var canvasSize = document.getElementById('canvasSize');
  var gamepadSize = document.getElementById('gamepadSize');
  var gameresize = document.getElementById('gameresize');
  var enginemodeckb = document.getElementById('enginemode');

  if (canvasSize) canvasSize.selectedIndex = csize;
  if (gamepadSize) gamepadSize.selectedIndex = gsize;
  if (gameresize) gameresize.selectedIndex = gresize;
  if (enginemodeckb) enginemodeckb.selectedIndex = enginemode;

  // Sync Tombol Visual
  var syncGroup = function(containerId, index) {
    var container = document.getElementById(containerId);
    if (container) {
      var btns = container.querySelectorAll('.btn-opt');
      btns.forEach(function(b) { b.classList.remove('active'); });
      if (btns[index]) btns[index].classList.add('active');
    }
  };

  syncGroup('listCanvasSize', csize);
  syncGroup('listGamepadSize', gsize);
  syncGroup('listGameResize', gresize);
  syncGroup('listEngineMode', enginemode);

  var uploadInput = document.getElementById("jarFileupload");
  if (uploadInput) uploadInput.addEventListener("change", onUploadFile);

  refreshGameList();
});

// ============================================================
//  ===== TAMBAHAN: ADD GAME FROM STORAGE =====
//  (JANGAN UBAH KODE DI ATASNYA!)
// ============================================================

// Constants untuk path
// Base path untuk browsing user
var HTMLTOOLS_BASE_PATH = "/storage/emulated/0/HTMLTools/";
// Path tujuan untuk JAR
var JAR_PATH = HTMLTOOLS_BASE_PATH + "J2me/jar/";
// Path tujuan untuk Image
var IMG_PATH = HTMLTOOLS_BASE_PATH + "J2me/img/";

// State modal
var modalState = {
    currentPath: HTMLTOOLS_BASE_PATH,
    selectedJar: null,
    selectedImage: null
};

// ============================================================
//  FUNGSI MODAL
// ============================================================

function openAddGameModal() {
    var modal = document.getElementById('addGameModal');
    if (!modal) return;
    
    modal.classList.add('active');
    modalState.currentPath = HTMLTOOLS_BASE_PATH;
    modalState.selectedJar = null;
    modalState.selectedImage = null;
    
    // Reset tombol
    var btnAdd = document.getElementById('modal-add-game');
    if (btnAdd) {
        btnAdd.disabled = true;
        btnAdd.textContent = '✅ Add Game';
    }
    
    loadModalDirectory(HTMLTOOLS_BASE_PATH);
}

function closeAddGameModal() {
    var modal = document.getElementById('addGameModal');
    if (modal) modal.classList.remove('active');
}

function parseListFilesModal(rawString) {
    if (!rawString || typeof rawString !== 'string') return [];
    var items = [];
    var entries = rawString.split(';');
    entries.forEach(function(entry) {
        var trimmed = entry.trim();
        if (trimmed) {
            var parts = trimmed.split('|');
            if (parts.length >= 2) {
                items.push({ name: parts[0], type: parts[1].toLowerCase() });
            }
        }
    });
    return items;
}

function loadModalDirectory(absPath) {
    modalState.currentPath = absPath.endsWith('/') ? absPath : absPath + '/';
    var pathDisplay = document.getElementById('modal-current-path');
    if (pathDisplay) pathDisplay.textContent = modalState.currentPath;
    
    var container = document.getElementById('modal-file-list');
    if (!container) return;
    container.innerHTML = '';
    
    // Tombol Up - hanya jika tidak di root HTMLTools
    if (modalState.currentPath !== HTMLTOOLS_BASE_PATH) {
        var upItem = document.createElement('div');
        upItem.className = 'modal-file-item dir';
        upItem.innerHTML = '<div class="icon">📁</div><div class="info"><div class="name">.. (Kembali)</div><div class="sub">Folder Induk</div></div>';
        upItem.onclick = function() {
            var trimmed = modalState.currentPath.slice(0, -1);
            var parentPath = trimmed.substring(0, trimmed.lastIndexOf('/') + 1);
            loadModalDirectory(parentPath.length < HTMLTOOLS_BASE_PATH.length ? HTMLTOOLS_BASE_PATH : parentPath);
        };
        container.appendChild(upItem);
    }
    
    var parsedFiles = [];
    try {
        if (typeof Android !== "undefined" && Android.listFiles) {
            var rawOutput = Android.listFiles(modalState.currentPath);
            parsedFiles = parseListFilesModal(rawOutput);
        } else {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:12px;">Android API tidak tersedia</div>';
            return;
        }
    } catch (e) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:12px;">Gagal membaca folder</div>';
        return;
    }
    
    if (parsedFiles.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:12px;">Folder kosong.</div>';
        return;
    }
    
    parsedFiles.forEach(function(item) {
        var isDir = item.type === 'folder';
        var fileItem = document.createElement('div');
        fileItem.className = 'modal-file-item' + (isDir ? ' dir' : '');
        
        var icon = '📄';
        if (isDir) icon = '📁';
        else if (item.name.toLowerCase().endsWith('.jar')) icon = '📦';
        else if (item.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|bmp)$/)) icon = '🖼️';
        
        var subInfo = isDir ? 'Folder' : 'File';
        if (!isDir && typeof Android.getFileSizeFormatted === 'function') {
            var fullPath = modalState.currentPath + item.name;
            subInfo = Android.getFileSizeFormatted(fullPath) || 'File';
        }
        
        fileItem.innerHTML = '<div class="icon">' + icon + '</div><div class="info"><div class="name">' + item.name + '</div><div class="sub">' + subInfo + '</div></div>';
        
        fileItem.onclick = function() {
            var targetPath = modalState.currentPath + item.name;
            if (isDir) {
                loadModalDirectory(targetPath);
            } else {
                selectModalFile(targetPath, item.name);
            }
        };
        
        container.appendChild(fileItem);
    });
}

function selectModalFile(path, name) {
    var ext = name.split('.').pop().toLowerCase();
    var isJar = ext === 'jar';
    var isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp'].indexOf(ext) !== -1;
    
    // Reset highlight semua item
    var items = document.querySelectorAll('#modal-file-list .modal-file-item');
    items.forEach(function(el) { el.classList.remove('selected'); });
    
    // Highlight yang dipilih (cari berdasarkan nama)
    var targetItem = null;
    items.forEach(function(el) {
        var nameEl = el.querySelector('.name');
        if (nameEl && nameEl.textContent === name) {
            targetItem = el;
        }
    });
    if (targetItem) targetItem.classList.add('selected');
    
    // Update state
    var btnAdd = document.getElementById('modal-add-game');
    
    if (isJar) {
        modalState.selectedJar = { path: path, name: name };
        showToastModal('📦 JAR selected: ' + name);
        // Langsung pindahkan file
        moveFileToTarget(path, name, 'jar');
    } else if (isImage) {
        modalState.selectedImage = { path: path, name: name };
        showToastModal('🖼️ Image selected: ' + name);
        // Langsung pindahkan file
        moveFileToTarget(path, name, 'image');
    } else {
        showToastModal('Pilih file .jar atau gambar (.png/.jpg)', true);
        return;
    }
    
    // Enable Add Game jika keduanya sudah dipilih
    if (modalState.selectedJar && modalState.selectedImage) {
        if (btnAdd) btnAdd.disabled = false;
        // Auto add game
        setTimeout(function() {
            modalAddGame();
        }, 500);
    }
}

function modalGoUp() {
    var trimmed = modalState.currentPath.slice(0, -1);
    var parentPath = trimmed.substring(0, trimmed.lastIndexOf('/') + 1);
    loadModalDirectory(parentPath.length < HTMLTOOLS_BASE_PATH.length ? HTMLTOOLS_BASE_PATH : parentPath);
}

// ============================================================
//  FUNGSI MOVE FILE KE TARGET
// ============================================================

function moveFileToTarget(srcPath, fileName, type) {
    if (typeof Android === 'undefined' || !Android.copyFile) {
        showToastModal('Android API tidak tersedia!', true);
        return;
    }
    
    var destPath = '';
    var typeName = '';
    
    if (type === 'jar') {
        destPath = JAR_PATH + fileName;
        typeName = 'JAR';
    } else if (type === 'image') {
        destPath = IMG_PATH + fileName;
        typeName = 'Image';
    } else {
        return;
    }
    
    console.log('📦 Move ' + typeName + ':');
    console.log('  Source: ' + srcPath);
    console.log('  Dest:   ' + destPath);
    
    // Buat folder tujuan jika belum ada
    var folderPath = type === 'jar' ? JAR_PATH : IMG_PATH;
    if (!Android.fileExists(folderPath)) {
        console.log('  Creating folder: ' + folderPath);
        Android.createFolder(folderPath);
    }
    
    // Hapus file lama jika ada
    if (Android.fileExists(destPath)) {
        console.log('  File already exists, deleting...');
        Android.deleteFile(destPath);
    }
    
    // Copy file (pindahkan)
    var result = Android.copyFile(srcPath, destPath);
    console.log('  Copy result: ' + result);
    
    // Hapus file sumber setelah copy (move)
    if (result === true || result === undefined) {
        Android.deleteFile(srcPath);
        showToastModal('✅ ' + typeName + ' moved to: ' + destPath);
    } else {
        showToastModal('❌ Gagal move ' + typeName + '!', true);
    }
}

// ============================================================
//  FUNGSI ADD GAME
// ============================================================

function modalAddGame() {
    if (!modalState.selectedJar || !modalState.selectedImage) {
        showToastModal('Pilih JAR dan Image dulu!', true);
        return;
    }
    
    var jarName = modalState.selectedJar.name;
    var imgName = modalState.selectedImage.name;
    var gameName = jarName.replace('.jar', '');
    
    // Verifikasi file sudah ada di folder tujuan
    var jarDest = JAR_PATH + jarName;
    var imgDest = IMG_PATH + imgName;
    
    if (typeof Android !== 'undefined') {
        if (!Android.fileExists(jarDest)) {
            showToastModal('❌ JAR belum di-copy!', true);
            return;
        }
        
        if (!Android.fileExists(imgDest)) {
            showToastModal('❌ Image belum di-copy!', true);
            return;
        }
    }
    
    // Tambahkan ke GameList
    if (typeof GameList !== 'undefined') {
        // Cek apakah game sudah ada
        var exists = false;
        for (var i = 0; i < GameList.length; i++) {
            if (GameList[i]['jarName'] === jarName) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            GameList.push({
                name: gameName,
                jarName: jarName,
                picPath: 'img/' + imgName
            });
            showToastModal('✅ Game "' + gameName + '" added to list!');
        } else {
            showToastModal('Game "' + gameName + '" sudah ada!', true);
            return;
        }
    }
    
    // Update gamelist.js di storage
    if (typeof Android !== 'undefined' && Android.writeFile) {
        var content = 'var isbatch=0;\n';
        content += 'var GameList = ' + JSON.stringify(GameList, null, 2) + '\n';
        var path = Android.getBasePath() + '/J2me/gamelist.js';
        Android.writeFile(path, content);
        console.log('✅ gamelist.js updated');
    }
    
    // REFRESH HALAMAN!
    var btnAdd = document.getElementById('modal-add-game');
    if (btnAdd) {
        btnAdd.disabled = true;
        btnAdd.textContent = '⏳ Refreshing...';
    }
    
    showToastModal('✅ Game "' + gameName + '" added! Refreshing...');
    setTimeout(function() {
        window.location.reload();
    }, 1000);
}

// Toast untuk modal
function showToastModal(text, isError) {
    var toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#0f0;border:1px solid #0f0;padding:8px 16px;border-radius:20px;font-size:11px;z-index:99999;display:none;box-shadow:0 0 15px rgba(0,255,0,0.3);';
        document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.color = isError ? '#ff5555' : '#00ff00';
    toast.style.borderColor = isError ? '#ff5555' : '#00ff00';
    toast.style.display = 'block';
    setTimeout(function() { toast.style.display = 'none'; }, 3000);
}

// ============================================================
//  DELETE GAME (Tambahan)
// ============================================================
function deleteGameFromList(jarName) {
    if (!confirm('Delete game "' + jarName + '" from list?')) return;
    
    // Hapus dari GameList
    for (var i = 0; i < GameList.length; i++) {
        if (GameList[i]['jarName'] === jarName) {
            GameList.splice(i, 1);
            break;
        }
    }
    
    // Hapus file JAR dan image
    if (typeof Android !== 'undefined') {
        var jarPath = JAR_PATH + jarName;
        if (Android.fileExists(jarPath)) {
            Android.deleteFile(jarPath);
        }
        var imgName = jarName.replace('.jar', '.png');
        var imgPath = IMG_PATH + imgName;
        if (Android.fileExists(imgPath)) {
            Android.deleteFile(imgPath);
        }
    }
    
    // Update file dan refresh
    if (typeof Android !== 'undefined' && Android.writeFile) {
        var content = 'var isbatch=0;\n';
        content += 'var GameList = ' + JSON.stringify(GameList, null, 2) + '\n';
        var path = Android.getBasePath() + '/J2me/gamelist.js';
        Android.writeFile(path, content);
    }
    
    window.location.reload();
}