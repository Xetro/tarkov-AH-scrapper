#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#include screen.ahk
#include JSON.ahk


#Persistent

; Written by LorenWard

#ifWinActive, ahk_exe EscapeFromTarkov.exe

*~F2::

Categories := ["flash_hiders_muzzle_brakes", "magazines"]

for index, category in Categories
{

	JSONpath = ../data/wiki/%category%-data.json
	FileRead, JSONString, %JSONpath%

	parsedJSON := JSON.Load(JSONString)


	for k, v in parsedJSON
	{
		search := v.marketSearchName
		offset := (33*v.marketPositionOffset)
		y := (170+offset)
		MouseMove, 150, 120
		sleep 200
		Click 
		sleep 300
		Send, %search%
		If (search = "Pachmayr tactical rubber grip" or search = "Magazine")
		{
			sleep 4000
		}
		sleep 900
		MouseMove, 150, %y%
		Click 
		filename := v.filePath
		timestamp := A_now
		prePath := "../data/images/raw/"
		extension := ".png"
		fullPath = %prePath%%filename%--%timestamp%%extension%
		sleep 900
		CaptureScreen("50, 100, 1450, 1170", "true", fullPath)
		sleep 300

	}

}

return

#IfWinActive

^!+x::
ExitApp
return