#!/bin/sh

for i in *; do
	if [ -d $i ]; then
		cd $i;
		cp ~/parser.pl .
#		if [ ! -e *.xml ]; then
#			continue;
#		fi
		for j in *-1-*.xml; do
			if [ ! -e "$j-data.json" ]; then
				perl parser.pl $j;
				rm $j
			fi
		done
		cd ..;
	fi
done
