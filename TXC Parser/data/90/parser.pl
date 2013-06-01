#!/usr/bin/perl
use XML::Parser;
use JSON::XS;
use strict;
use warnings;

my $LINES_PARSED = 0;

my $mday = (localtime(time))[3];
my $mon  = (localtime(time))[4];
my $year = (localtime(time))[5];

$mon++; # 0-based, but TXC is 1-based
$year += 1900; # perl's year is from 1900


my @FILES_TO_PROCESS;

if (not @ARGV) {
	print "Usage: perl $0 [-f] <FILE1> <FILE2>.\n",
	"Parses all files given. If -f is not specified, \n",
	"checks to see which file is currently in date. If -f\n",
	"is specified, skips checks. (-f allows non-*NIX support).\n";
	exit 1;
}

my $arg = shift @ARGV;
my $SKIP_CHECK = 0;
if ($arg =~ /--force/ or $arg =~ /-f/) {
	$SKIP_CHECK = 1;
}
else {
	push @ARGV, $arg;
}
if ($SKIP_CHECK == 0) {
	for (@ARGV) {
		s/-\d-/\*/;
		my @results = glob($_);
#		print "found: ", join(" ", @results);
	
		my @most_recent;

		for (@results) {
			my $startline = `cat $_ | grep StartDate`;
			$startline = (split/\n/,$startline)[0];
			my $endline = `cat $_ | grep EndDate`;
			 $endline = (split/\n/,$endline)[0];
			$startline =~ s/<\/?StartDate>//g;
			$startline =~ s/\s+//g;
			chomp $startline;
			$endline =~ s/<\/?EndDate>//g;
			$endline =~ s/\s+//g;
			chomp $endline;
			my @start = split/-/, $startline;
			my @end = split/-/, $endline;
			if ($year < $start[0] || ($mon < $start[1] and $year == $start[0])
			       	|| ($mday < $start[2] and $year == $start[0] 
				and $mon == $start[1])) {
				next;
			}
			elsif ($year > $end[0] || ($mon > $end[1] and $year == $end[0]) ||
				($mday > $end[2] and $mon == $end[1] and $year == $end[0])) {
					next;
			}
			else {
				if (@most_recent) {
					#choose most recent option.
					my $prevdata = $most_recent[1];
					my @vs = split/-/, $prevdata;
					if ($vs[0] < $start[0] || ($vs[1] < $start[1] and
							$vs[0] == $start[0]) || (
						$vs[2] < $start[2] and $vs[1] == $start[1]
							and $vs[0] == $start[0])) {
						$most_recent[0] = $_;#, $startline];
						$most_recent[1] = $startline;
					}
					else {
						next;
					}
				}
				else {
					$most_recent[0] = $_;#, $startline];
					$most_recent[1] = $startline;
				}
			}
	
		}
		push @FILES_TO_PROCESS, $most_recent[0];
		
	
	}
}
else {
	@FILES_TO_PROCESS = @ARGV;
}
if (not @FILES_TO_PROCESS) {
	print STDERR "Ack! No files left to process. Please update your ",
	"TransXChange data, or use -f to skip checks.\n";
	exit 35;
}
#print "Now I process: ", join(" ", @FILES_TO_PROCESS), "\n";

my %stations;

# storage format: jps id => an AoAs - id => [["Macarthur", "+2M"],...]
my %journeypatterns;
my %route_data;
my %jpats;
my %vjdata;

my $OPERATOR;
my $LAST_ATCO_CODE = "";
my $IN_ATCO_CODE;
my $IN_STATION_NAME;
my $END_STOPS;
my %LAST_ROUTE_SECT_DATA;
my $CURRENT_SECTION_ID;
my @stops = qw();
my $DONE_FROM;
my $INSIDE_SECT;

my @lines;
my $in_route_name;
my $in_route_ref;
my $route_ref;
my $route_name;
my $route_id;

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


my $activity;

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
	print "\rProcessed: $LINES_PARSED";
	$LINES_PARSED++;
	#%tags = shift;
	#print " " x $TABS_TO_USE, "$_[1] ";
	$in{$_[1]} = 1;
	if ($_[1] =~ /AtcoCode/) {
		$seqnum = undef;
		$IN_ATCO_CODE = 1;
	}
	elsif ($_[1] =~ /CommonName/) {
		$IN_STATION_NAME = 1;
	}

	if ($END_STOPS) {
	my $j = $_[1];	
		if ($_[1] =~ /RouteSection$/) {

			$CURRENT_SECTION_ID = $_{id};
			
		}
		elsif ($_[1] =~ /RouteLink/) {

		
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
		elsif ($_[1] =~ /^\s*Route\s*$/i) {
			$route_id = $_{id};
		}
		elsif ($_[1] =~ /JourneyPatternSection$/) {
			$finished_with_first_stuff = 1;
			#print "JPS ID: $_{id}\n";
			$jps_id = $_{id};			
		}
		elsif ($_[1] =~ /From/ or $_[1] eq "To") {
			$seqnum = $_{SequenceNumber};
			$INSIDE_SECT = 1 if not defined $seqnum ;

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
				if (defined $current_vj_data{days}) {
					push $current_vj_data{days}, $day1;
				}	
				else {
					my @a;
					$a[0] = $day1;
					$current_vj_data{days} = \@a;
				}
			}
		}


	
	}
}



sub StartDocument {}
sub EndTag {
	$LINES_PARSED++;
	print "\rProcessed: $LINES_PARSED";
	$in{$_[1]} = undef;
	if ($_[1] eq "StopPoints") { 
		$END_STOPS = 1;



     	}
	elsif ($_[1] eq "To" or $_[1] eq "From") {
		if (not defined $seqnum) {
			$INSIDE_SECT = 0;
		}
		else {
			$journeypatterns{$jps_id}[$seqnum - 1]  = [$current_SPR, $current_tdif];
		}
	}
	elsif ($_[1] eq "RouteLink") {

		if ($#stops == -1) {
			$stops[0] = $LAST_ROUTE_SECT_DATA{From};
			$stops[1] = $LAST_ROUTE_SECT_DATA{To};
		}
		else {
			if ($stops[$#stops] ne $LAST_ROUTE_SECT_DATA{From}) {
				$stops[$#stops + 1] = $LAST_ROUTE_SECT_DATA{From};
			}
			$stops[$#stops + 1] = $LAST_ROUTE_SECT_DATA{To};
		}
	}
	elsif ($_[1] eq "RouteSection") {

		@stops = qw();
	}
	elsif ($_[1] =~ /^\s*Route\s*$/i) {

		#printnicely($route_data{$route_ref});

		$route_data{$route_id} = {
			id => $route_id,
			rs_ref => $route_ref,
			name => $route_name
		};
	}
	elsif ($_[1] eq "JourneyPatternSection") {









		$current_tdif = undef;

	}
	elsif ($_[1] eq "JourneyPattern") {

		#my $s = \%current_jpat_data;
		my $jpsect = $current_jpat_data{jpatsect};
		$current_jpat_data{jpatsect} = $journeypatterns{$jpsect};
		my $route = $current_jpat_data{route};
		$current_jpat_data{route} = 
			$route_data{$route};
		$jpats{$current_jpat_data{id}} = {%current_jpat_data};
	}
	elsif ($_[1] eq "VehicleJourney") {

		#for (keys %current_vj_data) {
		#	print "$_: $current_vj_data{$_} ";
		#}
		#print "\n";
		my $jpr = $current_vj_data{jpref};
		$current_vj_data{jpref} = $jpats{$jpr};
		#my $s = \%current_vj_data;
		$vjdata{$current_vj_data{vjcode}} = {%current_vj_data};
		my $route = $jpats{$jpr}{route};
		if (defined $route_data{$route}{id}) {
			$route_data{$route}{line} = $current_vj_data{line};
		}
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



	$LINES_PARSED++;
	print "\rProcessed: $LINES_PARSED";
	s/\s+$//;
	if ($_ eq "") {
		return;
	}
	if ($IN_ATCO_CODE) {
		$LAST_ATCO_CODE = $_;
		$IN_ATCO_CODE = 0;
	}
	elsif ($in{OperatorShortName}) {
		$OPERATOR = $_;

	}
	elsif ($IN_STATION_NAME) {

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
		$current_tdif .= " $activity";
		$inside_runtime = 0;
	}
	elsif ($in_line) {
		#print "$_\n";
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
	elsif ($in{Activity}) {
		if ($_ eq "pass") {
			$activity = $_;
		}
		elsif ($_ eq "pickUpAndSetDown") {
			$activity = "pasd";
		}
		elsif ($_ =~ /pickUp/i) {
			$activity ="pickUp";
		}
		elsif (/setDown/i) {
			$activity ="setDown";
		}
		else {
			warn "Unkown <Activity> type: $_";
			$activity = "pasd"; # just assume...
		}
	}

}
sub PI{}
sub EndDocument{}


my $TABS_TO_USE = 0;



my $pi = XML::Parser->new(Style => "Stream");
my $FILE = shift @FILES_TO_PROCESS;
print "$FILE:\n";
$pi->parsefile($FILE);

for (@FILES_TO_PROCESS) {
	print "$_:\n";
	$END_STOPS = undef;
	$finished_with_first_stuff = undef;
	$LINES_PARSED = 0;
	print "\n";
	$pi->parsefile($_);
}
print "\n";




my $code = JSON::XS->new->ascii->pretty;
open FILE, ">", "$FILE-data.json" or warn "\nNot outputting data to file: $!";
print FILE "var OPERATOR = \"$OPERATOR\";\n";
print "Saving:";

#print FILE ";\n\nvar ROUTES = ", $code->encode( \%route_data );
print " Lines";
print FILE "\n\nvar LINES = ", $code->encode( \%lines );
print " Stations";
print FILE ";\n\nvar stations = ", $code->encode( \%stations);

print " VJ Data";
print FILE ";\n\nvar TRIP_DATA = ", $code->encode( \%vjdata), ";\n\n";
close FILE;
print " - DONE!\n\n";
