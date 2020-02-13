#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#include screen.ahk
#include JSON.ahk

FileEncoding, UTF-8

#Persistent

#ifWinActive, ahk_exe EscapeFromTarkov.exe

*~F2::

Categories := ["keys_factory", "keys_customs", "keys_woods", "keys_shoreline", "keys_interchange", "keys_labs", "keys_reserve", "armor_vests", "armored_chest_rigs", "headwear", "loot"]
 
FileRead, slow_search, slow_search.txt
sSlow_search := StrReplace(slow_search, "`r`n", ",")

for index, category in Categories
{

	JSONpath = ../data/wiki/%category%-data.json
	FileRead, JSONString, %JSONpath%

	parsedJSON := JSON.Load(JSONString)

	if (category = "armor_vests" or category = "armored_chest_rigs") {
		MouseMove, 240, 80
		sleep 200
		Click  
		sleep 200
	}

	for k, v in parsedJSON
	{
		clipboard := ""
		search := v.marketSearchName
		offset := (33*v.marketPositionOffset)
		y := (160+offset) 
		MouseMove, 150, 120
		sleep 200
		Click  
		sleep 200
		clipboard := search
		ClipWait
		Send, ^v

		if (category = "magazines") {
			if search in %sSlow_search%
				sleep 3000
		} if (category = "762x51" or category = "762x54" or category = "762x39" or category = "762x25") {
			if search in %sSlow_search%
				sleep 2000
		} else {
			if search contains %sSlow_search% 
				sleep 3000
		}

		sleep 500
		Send, {BackSpace}
		LastChar := SubStr(search, 0, 1)
		sleep 400
		Send {Text}%lastChar%
		sleep 300

		sleep 400
		MouseMove, 45, %y%
		sleep 400
		Click 
		
		filename := v.filePath
		timestamp := A_now
		prePath := "../data/images/raw/"
		extension := ".png"
		fullPath = %prePath%%filename%--%timestamp%%extension%
		sleep 1000
		CaptureScreen("50, 100, 1600, 1170", "true", fullPath)
	}

	if (category = "armor_vests" or category = "armored_chest_rigs") {
		MouseMove, 130, 80
		sleep 200
		Click
		sleep 200
	}
}

return

#IfWinActive

^!+x::
ExitApp
return