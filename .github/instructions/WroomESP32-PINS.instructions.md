---
applyTo: '**/.ino'
---
Pin  	  Pin Label  	  GPIO  	  Safe to use?  	Reason
4	SENSOR_VP	GPIO36		Input only GPIO, cannot be configured as output
5	SENSOR_VN	GPIO39		Input only GPIO, cannot be configured as output
6	IO34	GPIO34		Input only GPIO, cannot be configured as output
7	IO35	GPIO35		Input only GPIO, cannot be configured as output
8	IO32	GPIO32		SAFE
9	IO33	GPIO33		SAFE
10	IO25	GPIO25		SAFE
11	IO26	GPIO26		SAFE
12	IO27	GPIO27		SAFE
13	IO14	GPIO14		SAFE
14	IO12	GPIO12		must be LOW during boot
16	IO13	GPIO13		SAFE
17	SHD/SD2	GPIO9		Connected to Flash memory
18	SWP/SD3	GPIO10		Connected to Flash memory
19	SCS/CMD	GPIO11		Connected to Flash memory
20	SCK/CLK	GPIO6		Connected to Flash memory
21	SDO/SD0	GPIO7		Connected to Flash memory
22	SDI/SD1	GPIO8		Connected to Flash memory
23	IO15	GPIO15		must be HIGH during boot, prevents startup log if pulled LOW
24	IO2	    GPIO2		must be LOW during boot and also connected to the on-board LED
25	IO0	    GPIO0		must be HIGH during boot and LOW for programming
26	IO4	    GPIO4		SAFE
27	IO16	GPIO16		SAFE
28	IO17	GPIO17		SAFE
29	IO5	    GPIO5		must be HIGH during boot
30	IO18	GPIO18		SAFE
31	IO19	GPIO19		SAFE
33	IO21	GPIO21		SAFE
34	RXD0	GPIO3		Rx pin, used for flashing and debugging
35	TXD0	GPIO1		Tx pin, used for flashing and debugging
36	IO22	GPIO22		SAFE
37	IO23	GPIO23		SAFE

## Button Simulation Best Practices

When interfacing ESP32 with hardware that has existing physical buttons:

**CORRECT METHOD (INPUT_PULLUP):**
```arduino
// Safe state (button not pressed)
pinMode(pin, INPUT_PULLUP);

// Simulate button press
pinMode(pin, OUTPUT);
digitalWrite(pin, LOW);
delay(pressTime);

// Release button
pinMode(pin, INPUT_PULLUP);
```

**AVOID:**
- Setting pins to OUTPUT HIGH/LOW continuously
- Using digitalWrite(pin, HIGH) for button simulation
- Keeping pins in OUTPUT mode when not actively pressing

**Why INPUT_PULLUP works:**
- Mimics natural button state (not pressed) with internal pull-up resistor
- OUTPUT LOW briefly simulates button press to ground
- Returns to INPUT_PULLUP to release button properly
- Allows physical buttons to work normally when ESP32 is idle