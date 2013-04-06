#!/usr/bin/perl
use XML::Parser;
use JSON::PP;
use strict;
use warnings;

my %stations;

# storage format: jps id => an AoAs - id => [["Macarthur", "+2M"],...]
my %journeypatterns;
my %route_data;
my %jpats;
my %vjdata;

my $LAST_ATCO_CODE = "";
my $IN_ATCO_CODE;
my $IN_STATION_NAME;
my $END_STOPS;
my %LAST_ROUTE_SECT_DATA;
my $CURRENT_SECTION_ID;
my @stops = qw();
my $DONE_FROM;
my $INSIDE_SECT;

my $in_route_name;
my $in_route_ref;
my $route_ref;
my $route_name;

my $jps_id;
my $jpl_id;
my $seqnum;
my $inside_SPR;
my $inside_runtime;
my $current_SPR;
my $current_tdif;
my $finished_with_first_stuff;

my $in_service;
my @current_service_days;
my %lines;
my $cur_line_id;
my $in_line;

my %current_jpat_data;
my %in;


my %current_vj_data;

my %daysToNumbers = (
	Monday => int 0,
	Tuesday => int 1,
	Wednesday => int 2,
	Thursday => int 3,
	Friday => int 4,
	Saturday => int 5,
	Sunday => int 6
);

my @days = qw(Monday Tuesday Wednesday Thursday Friday Saturday Sunday);

sub StartTag {
	#%tags = shift;
	#print " " x $TABS_TO_USE, "$_[1] ";
	$in{$_[1]} = 1;
	if ($_[1] =~ /AtcoCode/) {
		$IN_ATCO_CODE = 1;
	}
	elsif ($_[1] =~ /CommonName/) {
		$IN_STATION_NAME = 1;
	}

	if ($END_STOPS) {
	my $j = $_[1];	
		if ($_[1] =~ /RouteSection$/) {
			print "Begin RouteSection: id=$_{id}\n";
			$CURRENT_SECTION_ID = $_{id};
			
		}
		elsif ($_[1] =~ /RouteLink/) {
#			print "Begin RouteLink: id=$_{id}\n";
		
		}
		elsif (($_[1] =~ /From/ or $_[1] =~ /To/) and not defined $finished_with_first_stuff) {
			$INSIDE_SECT = 1;
		}
		elsif ($_[1] =~ /Description$/) {
			$in_route_name = 1;
		}
		elsif ($_[1] =~ /RouteSectionRef/) {
			$in_route_ref = 1;
		}
		elsif ($_[1] =~ /JourneyPatternSection$/) {
			$finished_with_first_stuff = 1;
			print "JPS ID: $_{id}\n";
			$jps_id = $_{id};			
		}
		elsif ($_[1] =~ /From/ or $_[1] eq "To") {
			$seqnum = $_{SequenceNumber};
			$journeypatterns{$seqnum} = @{[]};
		}
		elsif ($_[1] eq "StopPointRef") {
			$inside_SPR = 1;
		}
		elsif ($_[1] eq "RunTime") {
			$inside_runtime = 1;
		}
		elsif ($_[1] eq "Line") {
			$cur_line_id = $_{id};
		}
		elsif ($_[1] eq "LineName") {
			$in_line = 1;
		}
		elsif ($_[1] eq "JourneyPattern") {
			$current_jpat_data{id} = $_{id};
		}
		elsif ( $j =~ "Monday" or $j =~ "Tuesday" or $j =~ "Wednesday" or $j =~ "Thursday" or $j =~ "Friday" or $j =~ "Saturday" or $j =~ "Sunday" or $j =~ "Weekend") {
			my ($day1, $day2);
			$j =~ s/\s+$//;
			if ($j =~ /To/) {
				($day1, $day2) = split/To/,$j;
			}
			elsif ($j eq "Weekend") {
				$day1 = "Saturday";
				$day2 = "Sunday";
			}
			else {
				$day1 = $j;
			}
			if (defined $day2 and $day2 =~ /^\s+$/) {
				$day2 = undef;
			}
			
			my $day_1 = $daysToNumbers{$day1};
			my $day_2 = $daysToNumbers{$day2} if defined $day2;
			if (defined $day_2) {
				my @a = @days[$day_1..$day_2];
				$current_vj_data{days} = \@a;
			}
			else {
				$current_vj_data{days} = $day1;
			}
		}


	
	}
=begin
	$TABS_TO_USE++;
	@info = @_;
	$k = keys %_;
	if ($#k == -1) { 
		print "\n";
		return;
	}
	for $j (keys %_) {
		print $j , " => " , $_{$j}, " ";
	}
	print "\n";
=cut
}



sub StartDocument {}
sub EndTag {
	$in{$_[1]} = undef;
	if ($_[1] eq "StopPoints") { 
		$END_STOPS = 1;
		for (sort keys %stations) { 
			print "$_ => $stations{$_}\n"; 
		}
     	}
	elsif ($_[1] eq "To" or $_[1] eq "From") {
		if (not defined $seqnum) {
			$INSIDE_SECT = 0;
		}
		else {
			$journeypatterns{$jps_id}[$seqnum - 1]  = [$stations{$current_SPR}, $current_tdif];
		}
	}
	elsif ($_[1] eq "RouteLink") {
#		print "From: $stations{$LAST_ROUTE_SECT_DATA{From}} To: $stations{$LAST_ROUTE_SECT_DATA{To}}\n";
		if ($#stops == -1) {
			$stops[0] = $stations{$LAST_ROUTE_SECT_DATA{From}};
			$stops[1] = $stations{$LAST_ROUTE_SECT_DATA{To}};
		}
		else {
			if ($stops[$#stops] ne $stations{$LAST_ROUTE_SECT_DATA{From}}) {
				$stops[$#stops + 1] = $stations{$LAST_ROUTE_SECT_DATA{From}};
			}
			$stops[$#stops + 1] = $stations{$LAST_ROUTE_SECT_DATA{To}};
		}
	}
	elsif ($_[1] eq "RouteSection") {
		print "End RouteSection: $CURRENT_SECTION_ID.\n"; # Stops: ";

=begin

		$i = 0;
		#$route_data{$CURRENT_SECTION_ID} = qw();
		for (@stops) {
			$route_data{$CURRENT_SECTION_ID}[$i] = $_;
			$i++;
			print "$_ ";
		}
		#@{$route_data{$CURRENT_SECTION_ID}} = @stops;
		print "\n";
=cut
		@stops = qw();
	}
	elsif ($_[1] eq "Route") {
#		print "Processed: $route_name ($route_ref). Stops: ", join(' ', @{$route_data{$route_ref}}), "\n";
		#printnicely($route_data{$route_ref});
	}
	elsif ($_[1] eq "JourneyPatternSection") {
		print "End JPS.\n";
#		print "End JPS. Here's some tidbits:\n";
#		for $k (@{$journeypatterns{$jps_id}}) {
#			print "  $k->[0] ";
#			if ($k->[1]) {
#				print "(+$k->[1])";
#			}
#			print "\n";
#		}
#		$current_tdif = undef;
#		sleep 2;
	}
	elsif ($_[1] eq "JourneyPattern") {
		print "End JourneyPattern data. ID: $current_jpat_data{id}, Direction: $current_jpat_data{direction}, RouteRef: $current_jpat_data{route}, JPatSectRef: $current_jpat_data{jpatsect}\n";
		#my $s = \%current_jpat_data;
		my $jpsect = $current_jpat_data{jpatsect};
		$current_jpat_data{jpatsect} = $journeypatterns{$jpsect};
		$jpats{$current_jpat_data{id}} = {%current_jpat_data};
	}
	elsif ($_[1] eq "VehicleJourney") {
		print "End vehicle journey. ";
		for (keys %current_vj_data) {
			print "$_: $current_vj_data{$_} ";
		}
		print "\n";
		my $jpr = $current_vj_data{jpref};
		$current_vj_data{jpref} = $jpats{$jpr};
		#my $s = \%current_vj_data;
		$vjdata{$current_vj_data{vjcode}} = {%current_vj_data};
		%current_vj_data = ();
	}
}
sub printnicely {
	foreach my $j (@_) {
		print "$j ";
	}
	print "\n";
}
sub Text {
#	if ($_ !~ /^\s+$/ and $_ !~ /^$/) {
#	       	print " " x $TABS_TO_USE, "$_\n";
#	}
	s/\s+$//;
	if ($_ eq "") {
		return;
	}
	if ($IN_ATCO_CODE) {
		$LAST_ATCO_CODE = $_;
		$IN_ATCO_CODE = 0;
	}
	elsif ($IN_STATION_NAME) {
#		print "Process: $_\n";
		s/Station //;
		s/(Platform.+)/\($1\)/;
		$stations{$LAST_ATCO_CODE} = $_;
		$IN_STATION_NAME = 0;
	}
	elsif ($INSIDE_SECT and $_ !~ /^$/) {
		if ($DONE_FROM) {
			$DONE_FROM = 0;
			#	print "$_";
			$LAST_ROUTE_SECT_DATA{To} = $_;
		}
		else {
			$LAST_ROUTE_SECT_DATA{From} = $_;
			$DONE_FROM = 1;
		}
	}
	elsif ($in_route_ref) {
		$route_ref  = $_;
		$in_route_ref = 0;
	}
	elsif ($in_route_name) {
		$route_name = $_;
		$in_route_name = 0;
	}
	elsif ($inside_SPR) {
		$current_SPR = $_;
		$inside_SPR = 0;
	}
	elsif ($inside_runtime) {
		s/PT//;
		$current_tdif = $_;
		$inside_runtime = 0;
	}
	elsif ($in_line) {
		$lines{$cur_line_id} = $_;
		$in_line = 0;
	}
	elsif ($in{Direction}) {
		$in{Direction} = 0;
		$current_jpat_data{direction} = $_;
	}
	elsif ($in{RouteRef}) {
		$in{RouteRef} = 0;
		$current_jpat_data{route} = $_;
	}
	elsif ($in{JourneyPatternSectionRefs}) {
		$in{JourneyPatternSectionRefs} = 0;
		$current_jpat_data{jpatsect} = $_;
	}
	elsif ($in{VehicleJourneyCode}) {
		$current_vj_data{vjcode} = $_;
	}
	elsif ($in{ServiceRef}) {
		$current_vj_data{service} = $_;
	}
	elsif ($in{LineRef}) {
		$current_vj_data{line} = $lines{$_};
	}
	elsif ($in{JourneyPatternRef}) {
		$current_vj_data{jpref} = $_;
	}
	elsif ($in{DepartureTime}) {
		$current_vj_data{leaves} = $_;
	}

}
sub PI{}
sub EndDocument{}


my $TABS_TO_USE = 0;

# begin actual processing

my $pi = XML::Parser->new(Style => "Stream");
my $FILE = shift;
$pi->parsefile($FILE);
#for (keys %stations) {
#	print "$_ => $stations{$_}\n";
#}
#
=begin
my %stations;

# storage format: jps id => an AoAs - id => [["Macarthur", "+2M"],...]
my %journeypatterns;
my %route_data;
my %jpats;
my %vjdata;
=cut
my $code = JSON::PP->new->ascii->pretty;
print "\n\nSTATIONS\n\n";
print $code->encode( \%stations );
print "\n\nJOURNEY PATTERN SECTIONS\n\n";
print $code->encode( \%journeypatterns );
print "\n\nROUTE DATA\n\n";
print $code->encode( \%route_data);
print "\n\nJOURNEY PATTERNS\n\n";
print $code->encode( \%jpats);
print "\n\nVEHICLE JOURNEY DATA\n\n";
print $code->encode( \%vjdata);

open FILE, ">", "$FILE-stations.json" or warn "Not outputting stations to file: $!";
print FILE $code->encode( \%stations);
close FILE;

open FILE, ">", "$FILE-jpsects.json" or warn "Not outputting jpsects: $!";
print FILE $code->encode( \%journeypatterns);
close FILE;

open FILE, ">", "$FILE-routedata.json" or warn "Not outputting routedata: $!";
print FILE $code->encode( \%route_data);
close FILE;

open FILE, ">", "$FILE-jpats.json" or warn "Not outputting journeypatterns: $!";
print FILE $code->encode( \%jpats);
close FILE;

open FILE, ">", "$FILE-vjdata.json" or warn "Not outputting vehicle journey info: $!";
print FILE $code->encode( \%vjdata);
close FILE;
